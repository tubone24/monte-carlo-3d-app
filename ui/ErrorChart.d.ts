export declare class ErrorChart {
    private canvas;
    private ctx;
    private errorHistory;
    private trialHistory;
    private piEstimateHistory;
    private insideHistory;
    private maxDataPoints;
    private manualScale;
    private scaleValue;
    constructor();
    private setupCanvas;
    private setupScaleControls;
    private updateScaleDisplay;
    private getCurrentMaxError;
    addDataPoint(totalBalls: number, error: number, piEstimate: number, insideBalls: number): void;
    private drawEmptyChart;
    private drawChart;
    private drawAxes;
    private formatNumber;
    private drawErrorLine;
    private drawTheoryLine;
    private drawLegend;
    private downloadCSV;
    reset(): void;
    dispose(): void;
}
//# sourceMappingURL=ErrorChart.d.ts.map