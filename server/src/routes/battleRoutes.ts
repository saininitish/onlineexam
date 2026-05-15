import { Router } from 'express';
import { BattleService } from '../services/battleService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authenticate, async (req: any, res) => {
  try {
    const { subject, chapter, topic, difficulty, time_limit, question_count, context, standard } = req.body;
    const battle = await BattleService.findAndJoinBattle(req.user.id, subject, chapter, topic, difficulty, time_limit, question_count, context, standard);
    res.json(battle);
  } catch (error: any) {
    console.error('[Battle Create Error]:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/history', authenticate, async (req: any, res) => {
  try {
    const history = await BattleService.getBattleHistory(req.user.id, 5);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/analysis', authenticate, async (req: any, res) => {
  try {
    const analysis = await BattleService.getBattleAnalysis(req.params.id);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/questions', authenticate, async (req: any, res) => {
  try {
    await BattleService.saveQuestions(req.params.id, req.body.questions);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/join', authenticate, async (req: any, res) => {
  try {
    const { battleId } = req.body;
    const battle = await BattleService.joinBattle(battleId, req.user.id);
    res.json(battle);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const battle = await BattleService.getBattle(req.params.id as string);
    res.json(battle);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/submit', authenticate, async (req: any, res) => {
  try {
    const result = await BattleService.submitAnswer(req.params.id as string, req.user.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/finish', authenticate, async (req, res) => {
  try {
    const { winnerId, score1, score2 } = req.body;
    const result = await BattleService.finishBattle(req.params.id as string, winnerId, { score1, score2 });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
