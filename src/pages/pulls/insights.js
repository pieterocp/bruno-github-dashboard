import { useGithub } from '@/providers/Github/Github';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Insights() {
  const { prs } = useGithub();
  const [chartData, setChartData] = useState(null);
  const [closedChartData, setClosedChartData] = useState(null);
  
  useEffect(() => {
    if (!prs || prs.length === 0) return;
    
    // Calculate monthly merge statistics
    const monthlyMerges = prs.reduce((stats, pr) => {
      // Skip PRs that aren't merged
      if (!pr.merged_at) return stats;
      
      const mergeDate = parseISO(pr.merged_at);
      const monthKey = format(mergeDate, 'yyyy-MM');
      
      if (!stats[monthKey]) {
        stats[monthKey] = {
          month: format(mergeDate, 'MMM yyyy'),
          count: 0,
          date: mergeDate, // Keep the date for sorting
        };
      }
      
      stats[monthKey].count++;
      return stats;
    }, {});
    
    // Convert to array and sort by date (oldest first)
    const monthlyDataArray = Object.values(monthlyMerges)
      .sort((a, b) => a.date - b.date);
    
    // Prepare data for Chart.js
    const data = {
      labels: monthlyDataArray.map(item => item.month),
      datasets: [
        {
          label: 'Merged PRs',
          data: monthlyDataArray.map(item => item.count),
          backgroundColor: 'rgba(234, 179, 8, 0.6)',
          borderColor: 'rgba(234, 179, 8, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    setChartData(data);
    
    // Calculate monthly closed statistics (includes both merged and non-merged)
    const monthlyClosed = prs.reduce((stats, pr) => {
      // Count all PRs that are closed (includes merged PRs)
      if (!pr.closed_at) return stats;
      
      const closedDate = parseISO(pr.closed_at);
      const monthKey = format(closedDate, 'yyyy-MM');
      
      if (!stats[monthKey]) {
        stats[monthKey] = {
          month: format(closedDate, 'MMM yyyy'),
          count: 0,
          date: closedDate, // Keep the date for sorting
        };
      }
      
      stats[monthKey].count++;
      return stats;
    }, {});
    
    // Convert to array and sort by date (oldest first)
    const closedDataArray = Object.values(monthlyClosed)
      .sort((a, b) => a.date - b.date);
    
    // Prepare data for Chart.js (closed PRs chart)
    const closedData = {
      labels: closedDataArray.map(item => item.month),
      datasets: [
        {
          label: 'Total Closed PRs',
          data: closedDataArray.map(item => item.count),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    setClosedChartData(closedData);
  }, [prs]);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pull Request Merges by Month',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Merged PRs: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Merged PRs',
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
  };
  
  const closedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Total Pull Requests Closed by Month',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Total Closed PRs: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Total Closed PRs',
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded shadow p-6">
        <div className="text-sm font-medium text-gray-500 mb-4">
          Monthly Pull Request Merge Trends
        </div>
        <div className="h-96">
          {chartData ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded shadow p-6">
        <div className="text-sm font-medium text-gray-500 mb-4">
          Total Monthly Pull Request Closure Trends
        </div>
        <div className="h-96">
          {closedChartData ? (
            <Bar data={closedChartData} options={closedChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 