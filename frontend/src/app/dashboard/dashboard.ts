import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { format } from 'echarts/types/src/util/time.js';
import { NgxEchartsDirective } from 'ngx-echarts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  barOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any[]) => {
        let tooltip = `${params[0].axisValue}<br/>`;
        params.forEach((p) => {
          tooltip += `${p.marker} ${p.seriesName}: ${p.value}<br/>`;
        });
        return tooltip;
      },
    },
    legend: {
      bottom: 4,
      textStyle: {
        fontSize: 10,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: 65,
      top: 30,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['Funds\nTransfer', 'FX', 'Investment'],
      axisTick: { alignWithLabel: true },
      axisLabel: {
        interval: 0,
        rotate: 0,
        fontSize: 12, // reduced from 12
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number, index: number) => {
          let step = 0;
          const upper = value + step;
          return `$${upper.toLocaleString()}`;
        },
      },
    },
    series: [
      {
        name: 'Low Risk',
        type: 'bar',
        stack: 'total',
        label: { show: false },
        color: '#61b33b',
        data: [2000, 5000, 11000],
      },
      {
        name: 'High Risk',
        type: 'bar',
        stack: 'total',
        color: '#ffcc00',
        data: [2000, 4000, 2000],
      },
      {
        name: 'Acceptable Risk',
        type: 'bar',
        stack: 'total',
        color: '#ff751a',
        data: [3000, null, null],
      },
      {
        name: 'Evaluated Risk',
        type: 'bar',
        stack: 'total',
        color: '#cc0000',
        data: [7000, null, null],
      },
    ],
  };

  donutOptions = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        fontSize: 10, // reduced from 12
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['70%', '60%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'outside',
          formatter: (params: any) => {
            return `$${params.value} (${params.percent}%)`; // only value and %
          },
          fontSize: 10,
          color: '#444',
        },

        labelLine: {
          show: true,
          length: 14,
          length2: 10,
        },
        data: [
          { value: 10821, name: 'Low Risk' },
          { value: 3250, name: 'Evaluated Risk' },
          { value: 6900, name: 'Acceptable Risk' },
          { value: 22783, name: 'High Risk' },
        ],
        color: ['#e74c3c', '#ffb74d', '#f8e71c', '#1cc9c3'],
      },
    ],
  };

  rmData = [
    {
      id: 'RM001',
      name: 'Tan Wei Ming',
      specialization: 'Investment Advisory',
      performance: 94,
      errorRate: '0.80%',
      avgProcessing: 3.2,
      total: 9,
      flagged: '0.0%',
      humanReview: '0.0%',
      str: '0.0%',
      riskScore: 17.6,
    },
    {
      id: 'RM002',
      name: 'Sarah Lim',
      specialization: 'Estate Planning',
      performance: 92,
      errorRate: '1.10%',
      avgProcessing: 2.8,
      total: 9,
      flagged: '5.0%',
      humanReview: '5.0%',
      str: '0.0%',
      riskScore: 25.3,
    },
    {
      id: 'RM003',
      name: 'Rajiv Sharma',
      specialization: 'Wealth Structuring',
      performance: 96,
      errorRate: '0.50%',
      avgProcessing: 3.5,
      total: 9,
      flagged: '14.3%',
      humanReview: '14.3%',
      str: '0.0%',
      riskScore: 31.4,
    },
    {
      id: 'RM004',
      name: 'Jennifer Ng',
      specialization: 'Alternative Investments',
      performance: 91,
      errorRate: '1.30%',
      avgProcessing: 2.6,
      total: 18,
      flagged: '18.0%',
      humanReview: '17.9%',
      str: '12.8%',
      riskScore: 36.2,
    },
    {
      id: 'RM005',
      name: 'David Tan',
      specialization: 'Family Offices Services',
      performance: 97,
      errorRate: '0.40%',
      avgProcessing: 4.1,
      total: 14,
      flagged: '13.3%',
      humanReview: '13.3%',
      str: '0.0%',
      riskScore: 32.1,
    },
    {
      id: 'RM006',
      name: 'Priya Kaur',
      specialization: 'Tax Planning',
      performance: 93,
      errorRate: '0.90%',
      avgProcessing: 3.0,
      total: 16,
      flagged: '12.5%',
      humanReview: '12.5%',
      str: '0.0%',
      riskScore: 27.8,
    },
    {
      id: 'RM007',
      name: 'Micheal Chen',
      specialization: 'Portfolio Management',
      performance: 95,
      errorRate: '0.70%',
      avgProcessing: 2.9,
      total: 13,
      flagged: '14.3%',
      humanReview: '14.3%',
      str: '9.5%',
      riskScore: 33.2,
    },
    {
      id: 'RM008',
      name: 'Hui Lin Wong',
      specialization: 'Digital Banking',
      performance: 89,
      errorRate: '1.50%',
      avgProcessing: 2.4,
      total: 2,
      flagged: '11.1%',
      humanReview: '11.1%',
      str: '0.0%',
      riskScore: 27.7,
    },
    {
      id: 'RM009',
      name: 'Ahmad Zulkifli',
      specialization: 'Islamic Banking',
      performance: 94,
      errorRate: '0.80%',
      avgProcessing: 3.7,
      total: 11,
      flagged: '24.2%',
      humanReview: '24.2%',
      str: '15.2%',
      riskScore: 41.8,
    },
  ];
}
