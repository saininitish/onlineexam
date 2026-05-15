import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';

export class BattleService {
  static async findAndJoinBattle(userId: string, subject: string, chapter: string, topic: string, difficulty: string = 'Medium', timeLimit: number = 60, questionCount: number = 5, context: string = '', standard: string = 'UG Level') {
    // Look for a pending battle with matching criteria
    const { data: existingBattle, error } = await supabase
      .from('battles')
      .select('*')
      .eq('status', 'pending')
      .eq('subject', subject)
      .eq('chapter', chapter)
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .eq('standard', standard)
      .eq('time_limit', timeLimit)
      .eq('question_count', questionCount)
      .neq('player1', userId)
      .limit(1)
      .maybeSingle();

    if (existingBattle) {
      return this.joinBattle(existingBattle.id, userId);
    } else {
      return this.createBattle(userId, subject, chapter, topic, difficulty, timeLimit, questionCount, context, standard);
    }
  }

  static async createBattle(userId: string, subject: string, chapter: string, topic: string, difficulty: string = 'Medium', timeLimit: number = 60, questionCount: number = 5, context: string = '', standard: string = 'UG Level') {
    const { data, error } = await supabase
      .from('battles')
      .insert([{ 
        player1: userId, 
        subject, 
        chapter,
        topic, 
        difficulty,
        standard,
        time_limit: timeLimit,
        question_count: questionCount,
        status: 'pending',
        context
      }])
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async joinBattle(battleId: string, userId: string) {
    const { data: battle, error: fetchError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (fetchError || !battle) throw new AppError('Battle not found', 404);
    if (battle.player2) throw new AppError('Battle already full', 400);
    if (battle.player1 === userId) throw new AppError('You cannot join your own battle', 400);

    const { data, error } = await supabase
      .from('battles')
      .update({ 
        player2: userId, 
        status: 'active' 
      })
      .eq('id', battleId)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async getBattle(battleId: string) {
    const { data, error } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1(name, points),
        p2:player2(name, points)
      `)
      .eq('id', battleId)
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async submitAnswer(battleId: string, userId: string, answerData: any) {
    const { question_id, selected, is_correct, response_time } = answerData;

    const { error } = await supabase
      .from('battle_answers')
      .insert([{
        battle_id: battleId,
        user_id: userId,
        question_id,
        selected,
        is_correct,
        response_time
      }]);

    if (error) throw new AppError(error.message, 500);
    return { success: true };
  }

  static async finishBattle(battleId: string, winnerId: string, scores: { score1: number, score2: number }) {
    const { error } = await supabase
      .from('battles')
      .update({
        winner: winnerId,
        score1: scores.score1,
        score2: scores.score2,
        status: 'completed'
      })
      .eq('id', battleId);

    if (error) throw new AppError(error.message, 500);

    // Update winner's points and streak
    if (winnerId) {
      const { data: userData } = await supabase.from('users').select('points, streak').eq('id', winnerId).single();
      if (userData) {
        await supabase.from('users').update({
          points: (userData.points || 0) + 50,
          streak: (userData.streak || 0) + 1
        }).eq('id', winnerId);
      }
    }

    return { success: true };
  }
  static async getBattleHistory(userId: string, limit: number = 5) {
    const { data, error } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1(name),
        p2:player2(name)
      `)
      .or(`player1.eq.${userId},player2.eq.${userId}`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  static async saveQuestions(battleId: string, questions: any[]) {
    const { error } = await supabase
      .from('battles')
      .update({ questions })
      .eq('id', battleId);
    
    if (error) throw new AppError(error.message, 500);
    return { success: true };
  }

  static async getBattleAnalysis(battleId: string) {
    const { data: battle, error: bError } = await supabase
      .from('battles')
      .select(`
        *,
        p1:player1(name),
        p2:player2(name)
      `)
      .eq('id', battleId)
      .single();

    if (bError) throw new AppError(bError.message, 500);

    const { data: answers, error: aError } = await supabase
      .from('battle_answers')
      .select('*')
      .eq('battle_id', battleId);

    if (aError) throw new AppError(aError.message, 500);

    return { ...battle, answers };
  }

  static async deleteBattle(battleId: string, userId: string) {
    console.log(`[BattleService] Attempting to delete battle: ${battleId} by user: ${userId}`);
    
    // Ensure the battle belongs to the user (either p1 or p2)
    const { data: battle, error: fetchError } = await supabase
      .from('battles')
      .select('player1, player2')
      .eq('id', battleId)
      .single();
    
    if (fetchError || !battle) {
      console.error('[BattleService] Battle not found:', battleId);
      throw new AppError('Battle not found', 404);
    }

    if (battle.player1 !== userId && battle.player2 !== userId) {
      console.warn('[BattleService] Unauthorized delete attempt:', { battleId, userId });
      throw new AppError('Not authorized to delete this battle', 403);
    }

    // 1. Delete associated answers first (Foreign Key constraint)
    const { error: ansError } = await supabase
      .from('battle_answers')
      .delete()
      .eq('battle_id', battleId);
    
    if (ansError) {
      console.error('[BattleService] Error deleting answers:', ansError);
      throw new AppError('Failed to delete battle answers: ' + ansError.message, 500);
    }

    // 2. Delete the battle record
    const { error } = await supabase
      .from('battles')
      .delete()
      .eq('id', battleId);
    
    if (error) {
      console.error('[BattleService] Error deleting battle:', error);
      throw new AppError('Failed to delete battle: ' + error.message, 500);
    }

    console.log(`[BattleService] Successfully deleted battle: ${battleId}`);
    return { success: true };
  }
}
