export const PROCUREMENT_STAGES = [
  { stageNumber: 1, stageName: 'Maturity Test', key: 'MATURITY_TEST' },
  { stageNumber: 2, stageName: 'Bags Allocation', key: 'BAGS_ALLOCATION' },
  { stageNumber: 3, stageName: 'Bags Filling', key: 'BAGS_FILLING' },
  { stageNumber: 4, stageName: 'Bags Stitching', key: 'BAGS_STITCHING' },
  { stageNumber: 5, stageName: 'Weight', key: 'WEIGHT' },
  { stageNumber: 6, stageName: 'Loading to Lorry', key: 'LOADING' },
  { stageNumber: 7, stageName: 'Documents Submission', key: 'DOCUMENTS_SUBMISSION' }
] as const;

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
