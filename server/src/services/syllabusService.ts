import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';

export class SyllabusService {
  static async uploadSyllabus(userId: string, rows: any[]) {
    // Transform rows to match DB schema
    const dataToInsert = rows.map(row => ({
      user_id: userId,
      subject: row.subject || row.Subject,
      chapter: row.chapter || row.Chapter,
      topic: row.topic || row.Topic,
      description: row.description || row.Description || row.Context || ''
    }));

    const { error } = await supabase
      .from('syllabuses')
      .insert(dataToInsert);

    if (error) throw new AppError(error.message, 500);
    return { success: true, count: dataToInsert.length };
  }

  static async getSubjects(userId: string) {
    const { data, error } = await supabase
      .from('syllabuses')
      .select('subject')
      .eq('user_id', userId);
    
    if (error) throw new AppError(error.message, 500);
    // Return unique subjects
    return [...new Set(data.map(d => d.subject))];
  }

  static async getChapters(userId: string, subject: string) {
    const { data, error } = await supabase
      .from('syllabuses')
      .select('chapter')
      .eq('user_id', userId)
      .eq('subject', subject);
    
    if (error) throw new AppError(error.message, 500);
    return [...new Set(data.map(d => d.chapter))];
  }

  static async getTopics(userId: string, subject: string, chapter: string) {
    const { data, error } = await supabase
      .from('syllabuses')
      .select('topic, description')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('chapter', chapter);
    
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async deleteAllSyllabus(userId: string) {
    const { error } = await supabase
      .from('syllabuses')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw new AppError(error.message, 500);
    return { success: true };
  }
}
