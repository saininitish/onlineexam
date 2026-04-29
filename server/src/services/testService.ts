import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';

export class TestService {
  static async getAllTests() {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async createTest(testData: any, creatorId: string) {
    // Sanitize data to match schema
    const { title, duration, marks_per_question, negative_mark } = testData;
    const cleanData = { 
      title, 
      duration: Number(duration), 
      marks_per_question: Number(marks_per_question), 
      negative_mark: Number(negative_mark),
      created_by: creatorId 
    };

    const { data, error } = await supabase
      .from('tests')
      .insert([cleanData])
      .select()
      .single();

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
      .select('id, user_id, test_id, score, time_taken, submitted_at, users(name, email), tests(title)')
      .order('submitted_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
  }
}
