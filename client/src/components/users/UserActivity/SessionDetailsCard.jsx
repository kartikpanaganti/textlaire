import React from 'react';
import { 
  FaDesktop, FaMobile, FaTablet, FaGlobe, FaClock, FaUserClock, 
  FaCalendarAlt, FaMapMarkerAlt, FaNetworkWired, FaSignal, 
  FaExclamationTriangle, FaEye, FaServer, FaHistory, 
  FaLocationArrow, FaFlag
} from 'react-icons/fa';
import { HiStatusOnline } from 'react-icons/hi';

const SessionDetailsCard = ({ session }) => {
  if (!session) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  };

  // Calculate session duration
  const calculateDuration = (loginTime, logoutTime) => {
    if (!loginTime) return 'N/A';
    
    const start = new Date(loginTime);
    const end = logoutTime ? new Date(logoutTime) : new Date();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds} seconds`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get device icon based on user agent
  const getDeviceIcon = () => {
    const device = session.deviceInfo?.device || '';
    if (device.toLowerCase().includes('mobile')) return <FaMobile className="text-blue-500" />;
    if (device.toLowerCase().includes('tablet')) return <FaTablet className="text-green-500" />;
    return <FaDesktop className="text-purple-500" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header with user info */}
      <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-lg flex items-center">
              {getDeviceIcon()}
              <span className="ml-2">
                {session.userId?.name || 'Unknown User'}
              </span>
              {session.securityFlags?.unusualLocation && (
                <span className="ml-2 text-amber-500" title="Unusual location detected">
                  <FaExclamationTriangle size={14} />
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{session.userId?.email}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              session.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                : session.forcedLogout
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {session.isActive ? 'Active' : session.forcedLogout ? 'Force Ended' : 'Ended'}
            </span>
            {session.lastActiveTime && !session.logoutTime && (
              <span className="text-xs text-gray-500 mt-1">
                Last active: {formatDate(session.lastActiveTime)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Session details */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-gray-700">Session Timeline</h4>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FaCalendarAlt className="text-blue-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Login Time</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(session.loginTime)}</p>
            </div>
          </div>

          {session.logoutTime && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaUserClock className="text-red-500" />
              </div>
              <div className="ml-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Logout Time</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(session.logoutTime)}</p>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FaClock className="text-green-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Duration</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {calculateDuration(session.loginTime, session.logoutTime)}
              </p>
            </div>
          </div>

          {session.idleTime > 0 && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaHistory className="text-amber-500" />
              </div>
              <div className="ml-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Idle Time</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.floor(session.idleTime / 60)} minutes
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FaEye className="text-purple-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Page Views</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.pageViews || 0}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FaServer className="text-indigo-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">API Calls</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.apiCalls || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-gray-700">Device Information</h4>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {getDeviceIcon()}
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Device</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.deviceInfo?.device || 'Unknown'}
                {session.deviceInfo?.osVersion && ` (${session.deviceInfo.os} ${session.deviceInfo.osVersion})`}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FaGlobe className="text-indigo-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Browser</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.deviceInfo?.browser || 'Unknown'}
                {session.deviceInfo?.browserVersion && ` ${session.deviceInfo.browserVersion}`}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <FaMapMarkerAlt className="text-red-500" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{session.deviceInfo?.ipAddress || 'Unknown'}</p>
            </div>
          </div>

          {session.deviceInfo?.screenResolution && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaDesktop className="text-green-500" />
              </div>
              <div className="ml-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Screen Resolution</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">{session.deviceInfo.screenResolution}</p>
              </div>
            </div>
          )}

          {(session.geoLocation?.country || session.geoLocation?.city) && (
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaLocationArrow className="text-blue-500" />
              </div>
              <div className="ml-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {[session.geoLocation.city, session.geoLocation.region, session.geoLocation.country]
                    .filter(Boolean)
                    .join(', ')}
                  {session.geoLocation.timezone && ` (${session.geoLocation.timezone})`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Info */}
      {session.connectionInfo && (session.connectionInfo.connectionType || session.connectionInfo.networkIdentifier) && (
        <div className="px-6 pb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 dark:border-gray-700">Network Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {session.connectionInfo.connectionType && (
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FaNetworkWired className="text-blue-500" />
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection Type</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{session.connectionInfo.connectionType}</p>
                </div>
              </div>
            )}

            {session.connectionInfo.isp && (
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FaSignal className="text-purple-500" />
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">ISP</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{session.connectionInfo.isp}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Flags */}
      {session.securityFlags && Object.values(session.securityFlags).some(flag => flag) && (
        <div className="px-6 pb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 dark:border-gray-700">Security Alerts</h4>
          <div className="space-y-2">
            {session.securityFlags.unusualLocation && (
              <div className="flex items-start p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <div className="flex-shrink-0">
                  <FaFlag className="text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">Login from unusual location detected</p>
                </div>
              </div>
            )}

            {session.securityFlags.multipleDeviceLogin && (
              <div className="flex items-start p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <div className="flex-shrink-0">
                  <FaFlag className="text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">Multiple simultaneous device logins detected</p>
                </div>
              </div>
            )}

            {session.securityFlags.rapidGeoChange && (
              <div className="flex items-start p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <div className="flex-shrink-0">
                  <FaFlag className="text-amber-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">Rapid geographic location change detected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity log if available */}
      {session.activityLog && session.activityLog.length > 0 && (
        <div className="px-6 pb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 dark:border-gray-700">Activity Log</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {session.activityLog.map((activity, index) => (
              <div key={index} className="text-sm py-2 border-b dark:border-gray-700 last:border-0">
                <div className="flex justify-between">
                  <span>{activity.action}</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatDate(activity.timestamp)}</span>
                </div>
                {activity.details && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.details}</p>
                )}
                {activity.path && (
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{activity.path}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetailsCard;
