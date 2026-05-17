import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';

export class TestService {
  static async getAllTests() {
    let { data, error } = await supabase
      .from('tests')
      .select('id, title, duration, marks_per_question, negative_mark, created_by, assigned_to, created_at')
      .order('created_at', { ascending: false });

    if (error && (error.message.includes('assigned_to') || error.message.includes('uuid') || error.code === '42883' || error.message.includes('operator does not exist'))) {
      console.warn('[getAllTests] assigned_to column issue or missing, falling back to standard select');
      const fallback = await supabase
        .from('tests')
        .select('id, title, duration, marks_per_question, negative_mark, created_by, created_at')
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async createTest(testData: any, creatorId: string) {
    // Sanitize data to match schema
    const { title, duration, marks_per_question, negative_mark, assigned_to } = testData;
    const cleanData: any = { 
      title, 
      duration: Number(duration), 
      marks_per_question: Number(marks_per_question), 
      negative_mark: Number(negative_mark),
      created_by: creatorId 
    };

    if (assigned_to !== undefined) {
      cleanData.assigned_to = (Array.isArray(assigned_to) && assigned_to.length === 0) ? null : (assigned_to || null);
    }

    let { data, error } = await supabase
      .from('tests')
      .insert([cleanData])
      .select()
      .single();

    if (error && (error.code === '22P02' || error.message.includes('uuid'))) {
      throw new AppError('Database Schema Error: Your "assigned_to" column in the "tests" table is currently of type UUID. To assign tests to multiple students, please open your Supabase Dashboard -> Table Editor -> tests -> edit "assigned_to" column and change its type from UUID to JSONB.', 400);
    }

    if (error && error.message.includes('assigned_to')) {
      console.warn('[createTest] assigned_to column missing, removing assigned_to and retrying');
      delete cleanData.assigned_to;
      const fallback = await supabase
        .from('tests')
        .insert([cleanData])
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async deleteTest(testId: string) {
    // Cascade delete is handled by DB in ideal cases, 
    // but here we manually cleanup for safety as per existing logic.
    await supabase.from('attempts').delete().eq('test_id', testId);
    await supabase.from('questions').delete().eq('test_id', testId);
    const { error } = await supabase.from('tests').delete().eq('id', testId);

    if (error) throw new AppError(error.message, 500);
    return true;
  }

  static async getResults() {
    const { data, error } = await supabase
      .from('attempts')
      .select('id, user_id, test_id, score, time_taken, submitted_at, tab_switches, fullscreen_exits, time_spent_map, users(name, email), tests(title)')
      .order('submitted_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
  }
}
