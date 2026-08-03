export interface BookmarkRepository {
  save(candidateId: string, jobId: string): Promise<boolean>;
  unsave(candidateId: string, jobId: string): Promise<boolean>;
  isSaved(candidateId: string, jobId: string): Promise<boolean>;
  findByCandidate(candidateId: string): Promise<string[]>;
}
