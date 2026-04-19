import { JUSEntry, IssueCard } from '@temix/types';
import { IssueCardBuilder } from '../IssueCard';

export function checkGasSafety(entry: JUSEntry): IssueCard | null {
  // Mock estimation
  const isHighRisk = entry.body.length > 10; 
  if (isHighRisk) {
    return IssueCardBuilder.build(
      'heuristic',
      'gas_safety',
      'High field count may lead to increased gas consumption.',
      'body',
      'Optimize the message body or check the sandbox gas trace.'
    );
  }
  return null;
}
