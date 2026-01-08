
/**
 * Generic k-Nearest Neighbors (k-NN) Search Implementation
 * 
 * k-NN is a non-parametric method used for classification and regression.
 * In this context, we use it for similarity search (finding k-nearest items).
 */

export type Vector = number[];
export type DistanceMetric = 'cosine' | 'euclidean';

export interface KNNItem<T> {
  item: T;
  vector: Vector;
  id: string;
}

export interface KNNResult<T> {
  item: T;
  score: number; // Similarity score (higher is better for cosine) or Distance (lower is better for euclidean)
}

export class KNNSearch<T> {
  private data: KNNItem<T>[] = [];
  private k: number;
  private metric: DistanceMetric;

  /**
   * Initialize KNN Search
   * @param k Number of neighbors to find (default: 3)
   * @param metric Distance metric to use (default: 'cosine')
   */
  constructor(k: number = 3, metric: DistanceMetric = 'cosine') {
    this.k = k;
    this.metric = metric;
  }

  /**
   * Add an item to the dataset
   * @param item The item object
   * @param vector The feature vector
   * @param id Unique identifier for the item
   */
  addItem(item: T, vector: Vector, id: string) {
    if (!vector || vector.length === 0) {
      console.warn(`KNN: Skipping item ${id} due to empty vector`);
      return;
    }
    this.data.push({ item, vector, id });
  }

  /**
   * Add multiple items to the dataset
   */
  addItems(items: { item: T; vector: Vector; id: string }[]) {
    items.forEach(i => this.addItem(i.item, i.vector, i.id));
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (1 means identical direction)
   */
  private cosineSimilarity(vecA: Vector, vecB: Vector): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate Euclidean distance between two vectors
   * Returns value >= 0 (0 means identical)
   */
  private euclideanDistance(vecA: Vector, vecB: Vector): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    }

    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      sum += Math.pow(vecA[i] - vecB[i], 2);
    }
    
    return Math.sqrt(sum);
  }

  /**
   * Find k-nearest neighbors for a query vector
   * @param queryVector The vector to search for
   * @param filterIds Optional list of IDs to exclude
   * @returns Array of nearest neighbors with scores
   */
  search(queryVector: Vector, filterIds: string[] = []): KNNResult<T>[] {
    if (this.data.length === 0) {
      return [];
    }

    // Calculate scores for all items
    const scores = this.data
      .filter(entry => !filterIds.includes(entry.id))
      .map(entry => {
        let score: number;
        if (this.metric === 'cosine') {
          score = this.cosineSimilarity(queryVector, entry.vector);
        } else {
          // For Euclidean, we invert/negate or just return distance. 
          // Usually KNN returns 'nearest', so smallest distance.
          // To keep interface consistent (higher is better?), we might transform it.
          // But typically search returns distances. 
          // Let's return the distance, but the sorting logic needs to know.
          score = this.euclideanDistance(queryVector, entry.vector);
        }
        return {
          item: entry.item,
          score
        };
      });

    // Sort and pick top K
    // For Cosine: Higher score is better (descending)
    // For Euclidean: Lower score (distance) is better (ascending)
    scores.sort((a, b) => {
      if (this.metric === 'cosine') {
        return b.score - a.score;
      } else {
        return a.score - b.score;
      }
    });

    return scores.slice(0, this.k);
  }
  
  /**
   * Clear all data
   */
  clear() {
    this.data = [];
  }
}



