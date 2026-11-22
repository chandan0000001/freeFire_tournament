import mongoose from 'mongoose';
import { AsyncLocalStorage } from 'node:async_hooks';

mongoose.set('transactionAsyncLocalStorage', true);
const effects = new AsyncLocalStorage();
export async function afterCommit(task) {
  const queue = effects.getStore();
  if (queue) { queue.push(task); return; }
  await task();
}
// Hold the HTTP response until all ledger, balance and status writes commit.
export const transactional = handler => async (req, res, next) => {
  let output;
  let committedEffects = [];
  try {
    await mongoose.connection.transaction(async () => {
      const queue = [];
      output = { status: 200, body: null };
      const reply = { status(code) { output.status = code; return reply; }, json(body) { output.body = body; return reply; } };
      await effects.run(queue, () => handler(req, reply, error => { throw error || new Error('Transaction failed'); }));
      if (output.status >= 400 || output.body?.success === false) {
        const error = new Error('Request rejected'); error.response = output; throw error;
      }
      committedEffects = queue;
    });
    for (const effect of committedEffects) {
      try { await effect(); } catch { console.error('[Post-commit] Notification failed; database changes committed.'); }
    }
    return res.status(output.status).json(output.body);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.body);
    next(error);
  }
};
