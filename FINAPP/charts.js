let mainChartInstance = null;
let pieChartInstance = null;

// Global Chart Defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#94a3b8";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 23, 42, 0.9)";
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

window.renderCharts = function(State) {
    renderMainChart(State);
    renderPieChart(State);
};

window.updateChartsTheme = function(theme) {
    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';

    Chart.defaults.color = textColor;
    
    if(mainChartInstance) {
        mainChartInstance.options.scales.x.grid.color = gridColor;
        mainChartInstance.options.scales.y.grid.color = gridColor;
        mainChartInstance.update();
    }
}

function renderMainChart(State) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChartInstance) {
        mainChartInstance.destroy();
    }

    // Process data for the last 6 months (mockup/simplification)
    const labels = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
    const incomeData = [2500, 3200, 4800, 4500, 4500, 4500]; // Ideally calculated from State
    const expenseData = [2000, 2400, 3100, 1800, 2100, 1260.50];

    // Create Gradients
    const gradientIncome = ctx.createLinearGradient(0, 0, 0, 400);
    gradientIncome.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
    gradientIncome.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const gradientExpense = ctx.createLinearGradient(0, 0, 0, 400);
    gradientExpense.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
    gradientExpense.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: gradientIncome,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                },
                {
                    label: 'Gastos',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: gradientExpense,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { usePointStyle: true, boxWidth: 8 }
                }
            },
            scales: {
                x: {
                    grid: { color: document.body.classList.contains('theme-dark') ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)' },
                    border: { display: false }
                },
                y: {
                    grid: { color: document.body.classList.contains('theme-dark') ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)' },
                    border: { display: false },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderPieChart(State) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    // Aggregate expenses by category for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const expensesByCategory = {};

    State.transactions.forEach(tx => {
        if (tx.type === 'expense') {
            const txDate = new Date(tx.date);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                expensesByCategory[tx.categoryId] = (expensesByCategory[tx.categoryId] || 0) + tx.amount;
            }
        }
    });

    // Extract data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [];

    // Order by amount descending
    const sortedCategories = Object.keys(expensesByCategory).sort((a,b) => expensesByCategory[b] - expensesByCategory[a]);

    sortedCategories.forEach(catId => {
        const cat = State.categories.find(c => c.id === catId);
        if (cat) {
            labels.push(cat.name);
            data.push(expensesByCategory[catId]);
            // Extract the CSS variable value for ChartJS, fallback if fails
            const colorVar = cat.color;
            if(colorVar.includes('var(')) {
                // Determine var name
                const varName = colorVar.replace('var(', '').replace(')', '');
                const computedColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
                backgroundColors.push(computedColor || '#6366f1');
            } else {
                backgroundColors.push(colorVar);
            }
        }
    });

    if (data.length === 0) {
        // Empty state
        labels.push('Sin Gastos');
        data.push(1);
        backgroundColors.push('rgba(148, 163, 184, 0.2)');
    }

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false // Using custom UI or tooltips instead
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if(context.label === 'Sin Gastos') return ' $0.00';
                            let value = context.raw;
                            return ' $' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}
