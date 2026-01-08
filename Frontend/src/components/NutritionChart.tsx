import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDatesForISOWeek } from '@/lib/utils';

interface NutritionData {
  [key: string]: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface NutritionChartProps {
  nutritionData: NutritionData;
  week: string;
}

const NutritionChart: React.FC<NutritionChartProps> = ({ nutritionData, week }) => {
  // Get the week dates and day names using backend-aligned logic
  const weekDates = getDatesForISOWeek(week);
  // Build chart data for the week, filling missing days with 0s
  const chartData = weekDates.map(({ date, day }) => {
    const data = nutritionData[date] || { calories: 0, protein: 0 };
    return {
      day,
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.name === 'Calories' ? ' kcal' : entry.name === 'Protein' ? 'g' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          background: '#10b981',
          borderRadius: 2,
          marginRight: 4,
        }} />
        <span style={{ color: '#10b981' }}>Calories</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          background: '#fff',
          border: '2px solid #10b981',
          borderRadius: 2,
          marginRight: 4,
        }} />
        <span style={{ color: '#10b981' }}>Protein</span>
      </span>
    </div>
  );

  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Weekly Nutrition Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Calories (kcal)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Protein (g)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="calories" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="Calories"
              />
              <Bar 
                yAxisId="right"
                dataKey="protein" 
                fill="#6b7280" // Tailwind gray-500
                radius={[4, 4, 0, 0]}
                name="Protein"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionChart; 