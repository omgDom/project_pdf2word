class RetryCharts {
    constructor(analytics) {
        this.analytics = analytics;
        this.charts = {};
        this.updateInterval = 5000; // 5 seconds
    }

    initialize() {
        this.createChartContainer();
        this.initializeCharts();
        this.startUpdates();
    }

    createChartContainer() {
        const container = document.createElement('div');
        container.className = 'charts-container';
        container.innerHTML = `
            <div class="chart-grid">
                <div class="chart-card">
                    <canvas id="retryDistributionChart"></canvas>
                </div>
                <div class="chart-card">
                    <canvas id="errorTypesChart"></canvas>
                </div>
                <div class="chart-card">
                    <canvas id="retryTimelineChart"></canvas>
                </div>
                <div class="chart-card">
                    <canvas id="durationChart"></canvas>
                </div>
            </div>
        `;
        document.querySelector('.analytics-dashboard').appendChild(container);
    }

    initializeCharts() {
        // Retry Distribution Pie Chart
        this.charts.distribution = new Chart(
            document.getElementById('retryDistributionChart'),
            {
                type: 'pie',
                data: {
                    labels: ['Successful', 'Failed', 'Cancelled'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(255, 206, 86, 0.6)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Retry Distribution'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            }
        );

        // Error Types Bar Chart
        this.charts.errorTypes = new Chart(
            document.getElementById('errorTypesChart'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Error Occurrences',
                        data: [],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Error Types Distribution'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        // Retry Timeline Line Chart
        this.charts.timeline = new Chart(
            document.getElementById('retryTimelineChart'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Retries Over Time',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Retry Timeline'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        // Duration Histogram
        this.charts.duration = new Chart(
            document.getElementById('durationChart'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Retry Durations',
                        data: [],
                        backgroundColor: 'rgba(153, 102, 255, 0.6)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Retry Duration Distribution'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
    }

    updateCharts() {
        const stats = this.analytics.getRetryStatistics();

        // Update Distribution Chart
        this.charts.distribution.data.datasets[0].data = [
            stats.successfulRetries,
            stats.failedRetries,
            stats.cancelledRetries
        ];
        this.charts.distribution.update();

        // Update Error Types Chart
        const errorEntries = Object.entries(stats.errorTypes);
        this.charts.errorTypes.data.labels = errorEntries.map(([type]) => type);
        this.charts.errorTypes.data.datasets[0].data = errorEntries.map(([, count]) => count);
        this.charts.errorTypes.update();

        // Update Timeline Chart
        const timelineData = this.getTimelineData(stats);
        this.charts.timeline.data.labels = timelineData.labels;
        this.charts.timeline.data.datasets[0].data = timelineData.data;
        this.charts.timeline.update();

        // Update Duration Chart
        const durationData = this.getDurationDistribution(stats.retryDurations);
        this.charts.duration.data.labels = durationData.labels;
        this.charts.duration.data.datasets[0].data = durationData.data;
        this.charts.duration.update();
    }

    getTimelineData(stats) {
        // Group retries by hour
        const hourlyData = {};
        const now = new Date();
        for (let i = 0; i < 24; i++) {
            const hour = new Date(now - i * 3600000);
            hourlyData[hour.getHours()] = 0;
        }

        // Fill in actual data
        stats.retryDurations.forEach(duration => {
            const hour = new Date(Date.now() - duration).getHours();
            hourlyData[hour]++;
        });

        return {
            labels: Object.keys(hourlyData),
            data: Object.values(hourlyData)
        };
    }

    getDurationDistribution(durations) {
        // Create duration bins (0-1s, 1-2s, etc.)
        const bins = {};
        for (let i = 0; i < 10; i++) {
            bins[i] = 0;
        }

        durations.forEach(duration => {
            const seconds = Math.floor(duration / 1000);
            if (seconds < 10) {
                bins[seconds]++;
            }
        });

        return {
            labels: Object.keys(bins).map(s => `${s}-${parseInt(s)+1}s`),
            data: Object.values(bins)
        };
    }

    startUpdates() {
        setInterval(() => {
            this.updateCharts();
        }, this.updateInterval);
    }
} 