/**
 * Background Job Queue Infrastructure
 * 
 * Provides a simple job queue for async processing
 * Uses Redis for distributed job processing (if available)
 * Falls back to in-memory queue for single-instance deployments
 * 
 * Use cases:
 * - Large transaction syncs (>1000)
 * - Bulk PDF generation
 * - Batch operations
 */

import { Redis } from '@upstash/redis'
import { logger } from './logger'

// Initialize Redis client (same as rate-limit.ts and cache.ts)
const hasValidRedisConfig = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('your-redis') &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('placeholder')

const redis = hasValidRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In-memory fallback queue
interface QueuedJob {
  id: string
  type: JobType
  data: any
  createdAt: number
  attempts: number
  maxAttempts: number
}

const inMemoryQueue: QueuedJob[] = []
const inMemoryProcessing = new Set<string>()

/**
 * Job types
 */
export enum JobType {
  SYNC_TRANSACTIONS = 'sync_transactions',
  GENERATE_PDF = 'generate_pdf',
  BULK_OPERATION = 'bulk_operation',
  CACHE_INVALIDATION = 'cache_invalidation',
}

/**
 * Job status
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Job interface
 */
export interface Job {
  id: string
  type: JobType
  data: any
  status: JobStatus
  createdAt: number
  attempts: number
  maxAttempts: number
  error?: string
}

/**
 * Enqueue a job
 */
export async function enqueueJob(
  type: JobType,
  data: any,
  options: { maxAttempts?: number; delay?: number } = {}
): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const maxAttempts = options.maxAttempts || 3
  const delay = options.delay || 0

  const job: Job = {
    id: jobId,
    type,
    data,
    status: JobStatus.PENDING,
    createdAt: Date.now(),
    attempts: 0,
    maxAttempts,
  }

  if (redis) {
    // Use Redis for distributed queue
    try {
      const queueKey = `vantirs:queue:${type}`
      const jobKey = `vantirs:job:${jobId}`
      
      // Store job
      await redis.set(jobKey, JSON.stringify(job))
      
      // Add to queue (with delay if specified)
      if (delay > 0) {
        // Use sorted set for delayed jobs (score = execution time)
        // Upstash Redis zadd requires object format: { score, member }
        await (redis as any).zadd(queueKey, { score: Date.now() + delay, member: jobId })
      } else {
        await redis.lpush(queueKey, jobId)
      }
      
      logger.info({
        event: 'JOB_ENQUEUED',
        jobId,
        type,
        queue: 'redis',
      })
      
      return jobId
    } catch (error: any) {
      logger.warn({
        event: 'JOB_ENQUEUE_FAILED',
        jobId,
        type,
        error: error.message,
        action: 'falling_back_to_memory',
      })
      // Fall through to in-memory queue
    }
  }

  // Fallback to in-memory queue
  inMemoryQueue.push({
    id: jobId,
    type,
    data,
    createdAt: Date.now() + delay,
    attempts: 0,
    maxAttempts,
  })

  logger.info({
    event: 'JOB_ENQUEUED',
    jobId,
    type,
    queue: 'memory',
  })

  return jobId
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<Job | null> {
  if (redis) {
    try {
      const jobKey = `vantirs:job:${jobId}`
      const jobData = await redis.get<string>(jobKey)
      if (jobData) {
        return JSON.parse(jobData)
      }
    } catch (error: any) {
      logger.warn({
        event: 'JOB_STATUS_FAILED',
        jobId,
        error: error.message,
      })
    }
  }

  // Check in-memory queue
  const job = inMemoryQueue.find(j => j.id === jobId)
  if (job) {
    return {
      id: job.id,
      type: job.type,
      data: job.data,
      status: inMemoryProcessing.has(jobId) ? JobStatus.PROCESSING : JobStatus.PENDING,
      createdAt: job.createdAt,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
    }
  }

  return null
}

/**
 * Process jobs (to be called by worker)
 * 
 * In production, this would be a separate worker process
 * For now, it's available for manual processing
 */
export async function processJob(
  jobId: string,
  processor: (data: any) => Promise<any>
): Promise<{ success: boolean; error?: string }> {
  const job = await getJobStatus(jobId)
  if (!job) {
    return { success: false, error: 'Job not found' }
  }

  if (job.status === JobStatus.COMPLETED) {
    return { success: true }
  }

  if (job.attempts >= job.maxAttempts) {
    return { success: false, error: 'Max attempts reached' }
  }

  try {
    if (redis) {
      const jobKey = `vantirs:job:${jobId}`
      await redis.set(
        jobKey,
        JSON.stringify({ ...job, status: JobStatus.PROCESSING, attempts: job.attempts + 1 })
      )
    } else {
      inMemoryProcessing.add(jobId)
    }

    // Process the job
    await processor(job.data)

    // Mark as completed
    if (redis) {
      const jobKey = `vantirs:job:${jobId}`
      await redis.set(
        jobKey,
        JSON.stringify({ ...job, status: JobStatus.COMPLETED, attempts: job.attempts + 1 })
      )
    } else {
      inMemoryProcessing.delete(jobId)
      const index = inMemoryQueue.findIndex(j => j.id === jobId)
      if (index >= 0) {
        inMemoryQueue.splice(index, 1)
      }
    }

    logger.info({
      event: 'JOB_COMPLETED',
      jobId,
      type: job.type,
      attempts: job.attempts + 1,
    })

    return { success: true }
  } catch (error: any) {
    // Mark as failed
    if (redis) {
      const jobKey = `vantirs:job:${jobId}`
      await redis.set(
        jobKey,
        JSON.stringify({
          ...job,
          status: JobStatus.FAILED,
          attempts: job.attempts + 1,
          error: error.message,
        })
      )
    } else {
      inMemoryProcessing.delete(jobId)
    }

    logger.error({
      event: 'JOB_FAILED',
      jobId,
      type: job.type,
      attempts: job.attempts + 1,
      error: error.message,
    })

    return { success: false, error: error.message }
  }
}

/**
 * Example: Enqueue a large transaction sync
 */
export async function enqueueTransactionSync(
  merchantId: string,
  limit: number = 1000
): Promise<string> {
  return enqueueJob(JobType.SYNC_TRANSACTIONS, {
    merchantId,
    limit,
  })
}

