import React, { useState, useEffect } from 'react';
import { Plus, Settings, X, Minimize, Maximize, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const TimeScale = ({ date }) => {
  // Generate marks for every 3 hours
  const hours = Array.from({ length: 8 }, (_, i) => i * 3);

  return (
    <div className="absolute w-full h-6 bottom-0 border-t border-gray-200">
    {hours.map(hour => (
      <div
      key={hour}
      className="absolute text-xs text-gray-500"
      style={{
        left: `${(hour / 24) * 100}%`,
                        transform: 'translateX(-50%)'
      }}
      >
      {`${hour.toString().padStart(2, '0')}:00`}
      </div>
    ))}
    </div>
  );
};

const DayTimeline = ({ date, activities }) => {
  const calculatePosition = (time) => {
    const activityDate = new Date(time);
    const hours = activityDate.getHours() + activityDate.getMinutes() / 60;
    return (hours / 24) * 100;
  };

  const calculateWidth = (activity) => {
    let durationMinutes;

    if (activity.duration != null) {
      durationMinutes = activity.duration;
    } else if (activity.startTime != null && activity.endTime != null) {
      const start = new Date(activity.startTime);
      const end = new Date(activity.endTime);
      durationMinutes = (end - start) / 60000; // Convert milliseconds to minutes
    } else {
      console.error("Insufficient parameters provided to calculateWidth");
      return 0;
    }

    return (durationMinutes / (24 * 60)) * 100;
  };


  return (
    <div className="mb-8">
    <h3 className="text-sm font-medium mb-2">
    {date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
    </h3>
    <div className="relative h-24 bg-gray-50 rounded border border-gray-200">
    {/* Grid lines for every 3 hours */}
    {Array.from({ length: 8 }, (_, i) => (
      <div
      key={i}
      className="absolute h-full w-px bg-gray-200"
      style={{ left: `${(i * 3 / 24) * 100}%` }}
      />
    ))}

    {activities.map((activity) => (
      <div
      key={activity.id}
      className="absolute h-12 rounded-md cursor-pointer hover:brightness-95 border border-white/20"
      style={{
        backgroundColor: activity.color,
        left: `${calculatePosition(activity.startTime)}%`,
        width: `${calculateWidth(activity)}%`, // Pass the entire activity object
        top: '4px'
      }}
      title={`${new Date(activity.startTime).toLocaleTimeString()}
    End Time: ${new Date(activity.endTime).toLocaleTimeString()}
      Duration: ${activity.duration}min
      ${activity.comment}
      ${activity.launchPoint?.label || ''}`}
      >
      <div className="flex items-center h-full px-1 overflow-hidden">
      <span className="text-sm">{activity.launchPoint?.icon}</span>
      {calculateWidth(activity.duration) > 5 && (
        <span className="text-xs ml-1 text-white/90 truncate">
        {activity.comment}
        </span>
      )}
      </div>
      </div>
    ))}
    <TimeScale date={date} />
    </div>
    </div>
  );
};

const TimelineTracker = () => {
  const [activities, setActivities] = useState([]);
  const [launchPoints, setLaunchPoints] = useState([
    { id: 1, icon: '⚡', label: 'Spontaneous' },
    { id: 2, icon: '🌊', label: 'Flow' },
    { id: 3, icon: '🏋️', label: 'Pushed through' },
    { id: 4, icon: '🎯', label: 'Scheduled' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState({
    startTime: null,
    endTime: null,
    duration: null,
    color: '#4A90E2',
    comment: '',
    launchPoint: null,
    date: new Date().toISOString().split('T')[0]
  });
  const [isCompact, setIsCompact] = useState(false);
  const [isEditingLaunchPoints, setIsEditingLaunchPoints] = useState(false);
  const [newLaunchPoint, setNewLaunchPoint] = useState({ icon: '', label: '' });
  const [showPreviousDays, setShowPreviousDays] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedActivities = localStorage.getItem('timelineActivities');
    const savedLaunchPoints = localStorage.getItem('timelineLaunchPoints');

    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedLaunchPoints) setLaunchPoints(JSON.parse(savedLaunchPoints));

    setIsInitialized(true); // Data has been loaded
  }, []); // Empty dependency array ensures this runs once on mount

  // Save activities to localStorage when activities or isInitialized change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('timelineActivities', JSON.stringify(activities));
    }
  }, [activities, isInitialized]);

  // Save launchPoints to localStorage when launchPoints or isInitialized change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('timelineLaunchPoints', JSON.stringify(launchPoints));
    }
  }, [launchPoints, isInitialized]);



    const getDayActivities = (date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return activities.filter(activity => {
        const activityDate = new Date(activity.startTime);
        return activityDate >= dayStart && activityDate <= dayEnd;
      });
    };



    const addActivity = () => {
      const { startTime, endTime, duration, date } = newActivity;

      // Count how many time fields are filled
      const filledFields = [startTime, endTime, duration].filter(val => val !== null && val !== '').length;

      if (filledFields < 2) {
          alert('Please fill at least two of the three fields: Start Time, End Time, Duration');
          return;
        }

        let startDateTime, endDateTime, durationMinutes;

        if (startTime) {
            startDateTime = new Date(`${date}T${startTime}`);
          }

          if (endTime) {
              endDateTime = new Date(`${date}T${endTime}`);
            }

            if (startTime && endTime) {
                durationMinutes = (endDateTime - startDateTime) / 60000;
              } else if (startTime && duration) {
                  durationMinutes = duration;
                  endDateTime = new Date(startDateTime.getTime() + duration * 60000);
                } else if (endTime && duration) {
                    durationMinutes = duration;
                    startDateTime = new Date(endDateTime.getTime() - duration * 60000);
                  } else {
                      alert('Invalid input');
                      return;
                    }

      // Create the new activity
      setActivities([...activities, {
        ...newActivity,
        id: Date.now(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationMinutes
      }]);
      setNewActivity({
        startTime: null,
        endTime: null,
        duration: null,
        color: '#4A90E2',
        comment: '',
        launchPoint: null,
        date: new Date().toISOString().split('T')[0]
      });
      setIsAdding(false);
    };

    const exportData = () => {
      const data = {
        activities: activities,
        launchPoints: launchPoints,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const importData = (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setActivities(data.activities);
          setLaunchPoints(data.launchPoints);
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };

      reader.readAsText(file);
    };

    return (
      <div className={`bg-white shadow-lg rounded-lg ${isCompact ? 'w-96' : 'w-[800px]'} transition-all duration-200`}>
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b">
      <h2 className="text-lg font-semibold">Timeline Tracker</h2>
      <div className="flex gap-2">
      <button
      onClick={exportData}
      className="p-1 hover:bg-gray-100 rounded"
      title="Export Data"
      >
      <Download size={16} />
      </button>
      <label className="p-1 hover:bg-gray-100 rounded cursor-pointer">
      <input
      type="file"
      className="hidden"
      accept=".json"
      onChange={importData}
      />
      <Plus size={16} />
      </label>
      <button
      onClick={() => setShowPreviousDays(!showPreviousDays)}
      className="p-1 hover:bg-gray-100 rounded"
      title={showPreviousDays ? "Hide previous days" : "Show previous days"}
      >
      {showPreviousDays ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      <button
      onClick={() => setIsCompact(!isCompact)}
      className="p-1 hover:bg-gray-100 rounded"
      >
      {isCompact ? <Maximize size={16} /> : <Minimize size={16} />}
      </button>
      <button
      onClick={() => setIsEditingLaunchPoints(!isEditingLaunchPoints)}
      className="p-1 hover:bg-gray-100 rounded"
      >
      <Settings size={16} />
      </button>
      </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
      {/* Days */}
      {[0, ...(showPreviousDays ? [-1, -2] : [])].map((dayOffset) => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        return (
          <DayTimeline
          key={dayOffset}
          date={date}
          activities={getDayActivities(date)}
          />
        );
      })}

      {/* Quick Add Button */}
      {!isAdding && (
        <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
        >
        <Plus size={16} /> Add Activity
        </button>
      )}

      {/* Add Activity Form */}
      {isAdding && (
        <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
        <input
        type="date"
        value={newActivity.date}
        onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
        />
        <input
        type="time"
        value={newActivity.startTime || ''}
        onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
        placeholder="Start Time"
        />
        <input
        type="time"
        value={newActivity.endTime || ''}
        onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
        placeholder="End Time"
        />
        <input
        type="number"
        value={newActivity.duration}
        onChange={(e) => setNewActivity({ ...newActivity, duration: parseInt(e.target.value) })}
        className="border rounded px-2 py-1 text-sm w-20"
        placeholder="Minutes"
        />
        </div>
        <div className="flex gap-2">
        <input
        type="color"
        value={newActivity.color}
        onChange={(e) => setNewActivity({ ...newActivity, color: e.target.value })}
        className="w-8 h-8 rounded"
        />
        <input
        type="text"
        value={newActivity.comment}
        onChange={(e) => setNewActivity({ ...newActivity, comment: e.target.value })}
        className="border rounded px-2 py-1 text-sm flex-1"
        placeholder="Comment"
        />
        </div>
        <div className="flex gap-2 flex-wrap">
        {launchPoints.map((point) => (
          <button
          key={point.id}
          onClick={() => setNewActivity({ ...newActivity, launchPoint: point })}
          className={`px-2 py-1 rounded text-sm ${
            newActivity.launchPoint?.id === point.id
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 hover:bg-gray-200'
          }`}
          >
          {point.icon} {point.label}
          </button>
        ))}
        </div>
        <div className="flex justify-end gap-2">
        <button
        onClick={() => setIsAdding(false)}
        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
        Cancel
        </button>
        <button
        onClick={addActivity}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
        Add
        </button>
        </div>
        </div>
      )}

      {/* Launch Points Editor */}
      {isEditingLaunchPoints && (
        <div className="mt-4 border-t pt-4">
        <h3 className="font-medium mb-2">Edit Launch Points</h3>
        <div className="space-y-2">
        {launchPoints.map((point) => (
          <div key={point.id} className="flex items-center gap-2">
          <span>{point.icon}</span>
          <span>{point.label}</span>
          <button
          onClick={() => {
            setLaunchPoints(launchPoints.filter(p => p.id !== point.id));
          }}
          className="ml-auto text-red-500 hover:text-red-600"
          >
          <X size={16} />
          </button>
          </div>
        ))}
        <div className="flex gap-2">
        <input
        type="text"
        value={newLaunchPoint.icon}
        onChange={(e) => setNewLaunchPoint({ ...newLaunchPoint, icon: e.target.value })}
        className="border rounded px-2 py-1 text-sm w-16"
        placeholder="Icon"
        />
        <input
        type="text"
        value={newLaunchPoint.label}
        onChange={(e) => setNewLaunchPoint({ ...newLaunchPoint, label: e.target.value })}
        className="border rounded px-2 py-1 text-sm flex-1"
        placeholder="Label"
        />
        <button
        onClick={() => {
          if (newLaunchPoint.icon && newLaunchPoint.label) {
            setLaunchPoints([...launchPoints, { ...newLaunchPoint, id: Date.now() }]);
            setNewLaunchPoint({ icon: '', label: '' });
          }
        }}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
        Add
        </button>
        </div>
        </div>
        </div>
      )}
      </div>
      </div>
    );
};

export default TimelineTracker;
