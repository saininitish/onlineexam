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
    const { data, error } = await supabase
      .from('tests')
      .insert([{ ...testData, created_by: creatorId }])
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
      .select('*, users(name, email), tests(title)')
      .order('submitted_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
  }
}
