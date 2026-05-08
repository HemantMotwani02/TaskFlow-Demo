import React from 'react';

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

function isPastDate(dateStr) {
	const today = new Date();
	const date = new Date(dateStr);
	today.setHours(0,0,0,0);
	date.setHours(0,0,0,0);
	return date < today;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ScheduleCalendar = ({ onDateClick, meetings }) => {
	const today = new Date();
	const [month, setMonth] = React.useState(today.getMonth());
	const [year, setYear] = React.useState(today.getFullYear());
	const days = daysInMonth(year, month);
	const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

	const handlePrevMonth = () => {
		if (month === 0) {
			setMonth(11);
			setYear(year - 1);
		} else {
			setMonth(month - 1);
		}
	};
	const handleNextMonth = () => {
		if (month === 11) {
			setMonth(0);
			setYear(year + 1);
		} else {
			setMonth(month + 1);
		}
	};

	// Calculate first day of month for proper grid alignment
	const firstDay = new Date(year, month, 1).getDay();
	const prevMonthDays = firstDay;
	const totalSlots = Math.ceil((days + prevMonthDays) / 7) * 7;
	
	return (
		<div className="flex flex-col flex-1 p-2 sm:p-4 border rounded-lg shadow bg-white dark:bg-gray-900 w-full h-full overflow-hidden">
			<div className="flex items-center justify-between mb-3 px-2">
				<button onClick={handlePrevMonth} className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base border border-gray-200 dark:border-gray-700 font-bold" aria-label="Previous month">&lt;</button>
				<span className="font-bold text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-100">{monthName} {year}</span>
				<button onClick={handleNextMonth} className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm sm:text-base border border-gray-200 dark:border-gray-700 font-bold" aria-label="Next month">&gt;</button>
			</div>
			{/* Weekday headers */}
			<div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
				{WEEKDAYS.map(d => (
					<div key={d} className="text-center text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 py-1">{d}</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-0.5 sm:gap-1 flex-1">
				{/* Empty cells for days before month starts */}
				{[...Array(prevMonthDays)].map((_, i) => (
					<div key={`empty-${i}`} className="border border-transparent"></div>
				))}
				{/* Actual days of the month */}
				{[...Array(days)].map((_, i) => {
					const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
					// Count meetings on this day; accept date or ISO datetime
                    const meetingItems = (meetings || []).filter(m => {
                        const scheduledDate = m?.scheduledAt || m?.scheduled_at;
                        if (!scheduledDate) return false;
                        // Prefer normalized scheduledAt (YYYY-MM-DD) returned by API
                        if (m?.scheduledAt && m.scheduledAt.length === 10) {
                            return m.scheduledAt === dateStr;
                        }
                        const schedDate = String(scheduledDate).split('T')[0];
                        return schedDate === dateStr || scheduledDate === dateStr;
                    });
					const hasMeeting = meetingItems.length > 0;
					const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === i + 1;
					const disabled = isPastDate(dateStr);
					return (
					<button
						key={i}
						title={hasMeeting ? `${meetingItems.length} meeting${meetingItems.length > 1 ? 's' : ''}` : ''}
						className={`aspect-square min-h-[50px] sm:min-h-[65px] md:min-h-[80px] lg:min-h-[80px] w-full border rounded-sm sm:rounded-md flex flex-col items-stretch justify-start p-0.5 sm:p-1 md:p-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500
							${isToday ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}
							${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer'}
							${hasMeeting ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
						onClick={() => !disabled && onDateClick(dateStr)}
						disabled={disabled}
					>
							<div className="flex items-center justify-between mb-0.5">
								<span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-200'}`}>{i + 1}</span>
								{hasMeeting && (
									<span className="hidden sm:inline text-[9px] sm:text-[10px] text-blue-700 dark:text-blue-300 font-medium">{meetingItems.length}</span>
								)}
							</div>
							{hasMeeting && (
								<div className="mt-0.5 space-y-0.5 overflow-hidden flex-1">
									{meetingItems.slice(0, 3).map((m, idx) => (
										<div key={idx} className="hidden sm:block text-[8px] sm:text-[9px] md:text-[10px] px-0.5 sm:px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 truncate leading-tight">
											{(m.startTime || m.start_time || '--:--')} {(m.title || 'Meeting').substring(0, 15)}
										</div>
									))}
									{/* Mobile: just show colored dot */}
									<div className="sm:hidden w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
									{meetingItems.length > 3 && (
										<div className="hidden md:block text-[9px] text-blue-700 dark:text-blue-300 font-medium">+{meetingItems.length - 3}</div>
									)}
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default ScheduleCalendar;
