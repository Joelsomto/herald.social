import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { Task } from '@/types/herald';
import { Progress } from '@/components/ui/progress';

interface TaskCardProps {
  task: Task;
  onClaim?: (taskId: string) => void;
}

export function TaskCard({ task, onClaim }: TaskCardProps) {
  const progressPercent = (task.progress / task.target) * 100;
  const isComplete = task.progress >= task.target;

  return (
    <div
      className={`p-3 rounded-lg border transition-all duration-200 ${
        isComplete
          ? 'bg-primary/10 border-primary/30 gold-glow'
          : 'bg-secondary/30 border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 ${
            isComplete ? 'text-primary glow-gold-sm' : 'text-muted-foreground'
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-foreground truncate">
              {task.title}
            </h4>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                task.type === 'daily'
                  ? 'bg-blue-500/20 text-blue-400'
                  : task.type === 'weekly'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-herald-ember/20 text-herald-ember'
              }`}
            >
              {task.type}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {task.progress}/{task.target}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Sparkles className="w-3 h-3" />
                +{task.reward} HTTN
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {isComplete && !task.completed && (
            <button
              onClick={() => onClaim?.(task.id)}
              className="mt-2 w-full text-xs font-medium py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Claim Reward
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface TasksPanelProps {
  tasks: Task[];
  onClaim?: (taskId: string) => void;
}

export function TasksPanel({ tasks, onClaim }: TasksPanelProps) {
  const dailyTasks = tasks.filter((t) => t.type === 'daily');
  const weeklyTasks = tasks.filter((t) => t.type === 'weekly');

  return (
    <div className="herald-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">
          Missions & Tasks
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Resets in 14h
        </div>
      </div>

      {dailyTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Daily
          </h4>
          {dailyTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClaim={onClaim} />
          ))}
        </div>
      )}

      {weeklyTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Weekly
          </h4>
          {weeklyTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClaim={onClaim} />
          ))}
        </div>
      )}
    </div>
  );
}
