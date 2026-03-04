import { apiGet, apiPost } from '../apiClient';
import { ApiError } from '../apiClient';

export type UserTask = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  task_type: 'daily' | 'weekly' | 'campaign';
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  created_at: string;
};

export type TasksResponse = {
  data: UserTask[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export const getUserTasks = async (params?: { completed?: boolean }) => {
  const queryParams = new URLSearchParams();
  if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());

  const query = queryParams.toString();
  try {
    return await apiGet<UserTask[]>(`/auth/users/profiles/me/tasks/${query ? `?${query}` : ''}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
};

export const claimTaskReward = async (taskId: string) => {
  return apiPost<{ success: boolean; reward: number }>(`/auth/users/profiles/me/tasks/${taskId}/claim/`);
};
