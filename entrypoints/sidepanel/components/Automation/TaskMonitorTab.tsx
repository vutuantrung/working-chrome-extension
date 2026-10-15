import "../../assets/css/components/TaskMonitorTab.css";
import { useState, useEffect } from "react";
import { FaTasks, FaCheckCircle, FaClock, FaTimesCircle, FaPlay, FaHistory, FaChevronDown } from "../../assets/constants/icons";
import { formatTime, formatDuration } from "../../helpers/helpers";
import { DEFAULT_SCROLLING_URL, TASK_STATES } from "../../helpers/constants";
import { Task } from "../../types/types";
import TaskPriorityBadge from "./TaskPriorityBadge";
import TaskStatusBadge from "./TaskStatusBadge";
import {
  extensionCommands,
  extensionStorage,
} from "../../application/services/SidepanelServices";

function TaskMonitorTab() {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [cancelingTaskIds, setCancelingTaskIds] = useState<Set<string>>(new Set());
  const [scrollFeedsNumber, setScrollFeedsNumber] = useState<number>(0);

  useEffect(() => {
    loadTasks();

    if (autoRefresh) {
      const interval = setInterval(loadTasks, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    const fetchData = async () => {
      const scriptName = "SCROLL_JOINED_GROUPS";
      const { activities } = await extensionStorage.get(["activities"]);
      const joinGroupActivity = (activities as any)?.find(
        (activity: any) => activity.name === scriptName
      );
      const scrollGroupsUrl = joinGroupActivity?.inputs?.defaultFeedGroupUrls ?? DEFAULT_SCROLLING_URL;
      setScrollFeedsNumber(scrollGroupsUrl.length);
    };

    fetchData();
  }, []);

  const loadTasks = async () => {
    try {
      const result = await extensionStorage.get(["taskList"]);
      if (result.taskList && Array.isArray(result.taskList)) {
        const tasks = result.taskList as Task[];
        setTaskList(tasks.slice(-10).reverse());
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const stopTask = async (taskId: string) => {
    setCancelingTaskIds((prev) => new Set(prev).add(taskId));
    try {
      await extensionCommands.cancelTask(taskId);
    } catch (error) {
      console.error("Error canceling task:", error);
    } finally {
      setCancelingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      loadTasks();
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const runningTasks = taskList.filter((t) => t.state === TASK_STATES.RUNNING);
  const pendingTasks = taskList.filter((t) => t.state === TASK_STATES.PENDING);
  const completedTasks = taskList.filter((t) => t.state === TASK_STATES.FINISHED || t.state === TASK_STATES.CANCELED);

  return (
    <div className="automation-tab-container task-monitor-container">
      <div className="monitor-header">
        <div className="refresh-toggle">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <label htmlFor="autoRefresh">Auto-refresh</label>
        </div>
      </div>

      <div className="stats-grid" aria-label="Task summary">
        <div className="stat-card stat-card--running">
          <div className="stat-value stat-value--running">
            <FaPlay className="stat-icon" aria-hidden="true" />
            <span>{runningTasks.length}</span>
          </div>
          <div className="stat-label">Running</div>
        </div>
        <div className="stat-card stat-card--pending">
          <div className="stat-value stat-value--pending">
            <FaClock className="stat-icon" aria-hidden="true" />
            <span>{pendingTasks.length}</span>
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-card--completed">
          <div className="stat-value stat-value--completed">
            <FaCheckCircle className="stat-icon" aria-hidden="true" />
            <span>{completedTasks.length}</span>
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card stat-card--total">
          <div className="stat-value stat-value--history">
            <FaHistory className="stat-icon" aria-hidden="true" />
            <span>{taskList.length}</span>
          </div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {runningTasks.length > 0 && (
        <div className="task-section">
          <div className="section-header">
            <FaPlay className="task-section-icon--running" />
            Running Tasks
          </div>
          {runningTasks.map((task) => (
            <div key={task.taskId} className="task-card">
              <div
                className="task-header"
                onClick={() => toggleTaskExpand(task.taskId)}
              >
                <div className="task-info">
                  <div className="task-name">{task.activityName}</div>
                  <div className="task-meta">
                    <TaskStatusBadge status={task.state} />
                    <TaskPriorityBadge priority={task.priority} />
                    <span className="platform-badge">{task.platform}</span>
                    <span>Tab: {task.tabId ?? "-"}</span>
                    <span>Started: {formatTime(task.createdTime)}</span>
                    {task.startTime && (
                      <span>Duration: {formatDuration(task.startTime)}</span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="stop-btn"
                    disabled={cancelingTaskIds.has(task.taskId)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopTask(task.taskId);
                    }}
                    title="Stop this running task"
                  >
                    <FaTimesCircle />
                    Stop
                  </button>
                  <FaChevronDown
                    className={`expand-icon ${expandedTasks.has(task.taskId) ? "expanded" : ""
                      }`}
                  />
                </div>
              </div>
              {expandedTasks.has(task.taskId) && (
                <div className="task-details">
                  <div className="detail-row">
                    <span className="detail-label">Task ID:</span>
                    <span className="detail-value">{task.taskId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tab ID:</span>
                    <span className="detail-value">{task.tabId ?? "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Activity ID:</span>
                    <span className="detail-value">{task.activityId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(task.createdTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div className="task-section">
          <div className="section-header">
            <FaClock className="task-section-icon--pending" />
            Pending Tasks
          </div>
          {pendingTasks.map((task: any) => (
            <div key={task.taskId} className="task-card">
              <div
                className="task-header"
                onClick={() => toggleTaskExpand(task.taskId)}
              >
                <div className="task-info">
                  <div className="task-name">{task.activityName}</div>
                  <div className="task-meta">
                    <TaskStatusBadge status={task.state} />
                    <TaskPriorityBadge priority={task.priority} />
                    <span className="platform-badge">{task.platform}</span>
                    <span>Tab: {task.tabId ?? "-"}</span>
                    <span>Queued: {formatTime(task.createdTime)}</span>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="stop-btn"
                    disabled={cancelingTaskIds.has(task.taskId)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopTask(task.taskId);
                    }}
                    title="Stop this pending task"
                  >
                    <FaTimesCircle />
                    Stop
                  </button>
                  <FaChevronDown
                    className={`expand-icon ${expandedTasks.has(task.taskId) ? "expanded" : ""
                      }`}
                  />
                </div>
              </div>
              {expandedTasks.has(task.taskId) && (
                <div className="task-details">
                  <div className="detail-row">
                    <span className="detail-label">Task ID:</span>
                    <span className="detail-value">{task.taskId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tab ID:</span>
                    <span className="detail-value">{task.tabId ?? "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Activity ID:</span>
                    <span className="detail-value">{task.activityId}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="task-section">
          <div className="section-header">
            <FaHistory className="task-section-icon--history" />
            Recent History
          </div>
          {completedTasks.slice(0, 5).map((task: Task) => (
            <div key={task.taskId} className="task-card">
              <div
                className="task-header"
                onClick={() => toggleTaskExpand(task.taskId)}
              >
                <div className="task-info">
                  <div className="task-name">{task.activityName}</div>
                  <div className="task-meta">
                    <TaskStatusBadge status={task.state} />
                    <TaskPriorityBadge priority={task.priority} />
                    <span className="platform-badge">{task.platform}</span>
                    <span>Tab: {task.tabId ?? "-"}</span>
                    {task.endTime && (
                      <span>Finished: {formatTime(task.endTime)}</span>
                    )}
                    {task.startTime && task.endTime && (
                      <span>
                        Duration: {formatDuration(task.startTime, task.endTime)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <FaChevronDown
                    className={`expand-icon ${expandedTasks.has(task.taskId) ? "expanded" : ""
                      }`}
                  />
                </div>
              </div>
              {expandedTasks.has(task.taskId) && (
                <div className="task-details">
                  <div className="detail-row">
                    <span className="detail-label">Task ID:</span>
                    <span className="detail-value">{task.taskId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tab ID:</span>
                    <span className="detail-value">{task.tabId ?? "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Activity ID:</span>
                    <span className="detail-value">{task.activityId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(task.createdTime).toLocaleString()}
                    </span>
                  </div>
                  {task.endTime && (
                    <div className="detail-row">
                      <span className="detail-label">Finished:</span>
                      <span className="detail-value">
                        {new Date(task.endTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {task.result && (
                    <div className="task-result">
                      <strong>Result:</strong>{" "}
                      {typeof task.result === "object" &&
                        (task.result?.groupIds || task.result?.groupLinks) ? (
                        <>
                          {task.result.groupIds && (
                            <span>
                              {task.result.groupLinks &&
                                task.result.groupLinks.length > 0 ? (
                                <>
                                  <span>Groups scrolled: {task?.result?.groupLinks?.length}</span>
                                  <span> | </span>
                                  <span>Feeds scrolled: {scrollFeedsNumber}</span>
                                  <ul className="task-result-links">
                                    {task.result.groupLinks.map(
                                      (link: string, idx: number) => (
                                        <li key={link}>
                                          <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {link}
                                          </a>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </>
                              ) : (
                                <>
                                  <span>Groups scrolled: {task?.result?.groupIds?.length}</span>
                                  <span> | </span>
                                  <span>Feeds scrolled: {scrollFeedsNumber}</span>
                                </>
                              )}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>{task.result as string}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {taskList.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <FaTasks />
          </div>
          <p>No tasks yet</p>
          <p>
            Tasks will appear here when automation is running
          </p>
        </div>
      )}
    </div>
  );
}

export default TaskMonitorTab;
