export const isValidDate = (date: any): boolean => {
  try {
    if (!date) return false;
    
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100;
    }
    
    if (date instanceof Date) {
      return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating date:', error);
    return false;
  }
};

export const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatDateForDisplay = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatShortDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    console.error('Error comparing dates:', error);
    return false;
  }
};

export const getCalendarDays = (year: number, month: number): Date[] => {
  try {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      
      if (days.length >= 42) break;
    }
    
    return days;
  } catch (error) {
    console.error('Error getting calendar days:', error);
    return [];
  }
};

type CycleStatus = {
  isCurrentMonth: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isToday: boolean;
  isPredicted: boolean;
};

export const getCycleDayStatus = (
  date: Date,
  cycles: any[],
  predictions: any[]
): CycleStatus => {
  try {
    const today = new Date();
    const isToday = isSameDay(date, today);
    const isCurrentMonth = true;
    
    let isPeriod = false;
    let isFertile = false;
    let isOvulation = false;
    let isPredicted = false;
    
    if (cycles && Array.isArray(cycles)) {
      for (const cycle of cycles) {
        if (cycle.days && Array.isArray(cycle.days)) {
          for (const day of cycle.days) {
            if (day.date && isSameDay(date, day.date)) {
              if (day.flow && day.flow !== 'none') {
                isPeriod = true;
              }
            }
          }
        }
      }
    }
    
    if (predictions && Array.isArray(predictions) && predictions.length > 0) {
      const prediction = predictions[0];
      
      if (prediction.nextPeriodDate && isSameDay(date, prediction.nextPeriodDate)) {
        isPeriod = true;
        isPredicted = true;
      }
      
      if (prediction.fertileWindowStart && prediction.fertileWindowEnd) {
        const fertileStart = new Date(prediction.fertileWindowStart);
        const fertileEnd = new Date(prediction.fertileWindowEnd);
        if (date >= fertileStart && date <= fertileEnd) {
          isFertile = true;
          isPredicted = true;
        }
      }
    }
    
    return {
      isCurrentMonth,
      isPeriod,
      isFertile,
      isOvulation,
      isToday,
      isPredicted
    };
  } catch (error) {
    console.error('Error getting cycle day status:', error);
    return {
      isCurrentMonth: false,
      isPeriod: false,
      isFertile: false,
      isOvulation: false,
      isToday: false,
      isPredicted: false
    };
  }
};

export const getDaysBetween = (date1: string | Date, date2: string | Date): number => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error('Error calculating days between:', error);
    return 0;
  }
};