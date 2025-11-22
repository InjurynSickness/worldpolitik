// Comprehensive logging system for debugging game initialization and performance

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.DEBUG;
    private logs: Array<{ timestamp: number; level: LogLevel; category: string; message: string; data?: any }> = [];
    private maxLogs = 1000;
    private debugPanel: HTMLDivElement | null = null;

    private constructor() {
        this.setupDebugPanel();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private setupDebugPanel(): void {
        // Create debug panel in bottom-right corner
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 400px;
            max-height: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 10px;
            border: 2px solid #00ff00;
            border-radius: 4px;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(this.debugPanel);

        // Toggle with F3 key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }

    public toggleDebugPanel(): void {
        if (this.debugPanel) {
            this.debugPanel.style.display =
                this.debugPanel.style.display === 'none' ? 'block' : 'none';
        }
    }

    public showDebugPanel(): void {
        if (this.debugPanel) {
            this.debugPanel.style.display = 'block';
        }
    }

    public hideDebugPanel(): void {
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none';
        }
    }

    private updateDebugPanel(): void {
        if (!this.debugPanel) return;

        const recentLogs = this.logs.slice(-20); // Show last 20 logs
        this.debugPanel.innerHTML = `
            <div style="margin-bottom: 8px; border-bottom: 1px solid #00ff00; padding-bottom: 4px;">
                <strong>DEBUG PANEL</strong> (F3 to toggle) | ${this.logs.length} logs
            </div>
            ${recentLogs.map(log => {
                const color = this.getColorForLevel(log.level);
                const time = new Date(log.timestamp).toLocaleTimeString();
                return `<div style="color: ${color}; margin-bottom: 2px;">
                    [${time}] [${log.category}] ${log.message}
                    ${log.data ? '<pre style="margin: 2px 0; font-size: 10px;">' + JSON.stringify(log.data, null, 2) + '</pre>' : ''}
                </div>`;
            }).join('')}
        `;

        // Auto-scroll to bottom
        this.debugPanel.scrollTop = this.debugPanel.scrollHeight;
    }

    private getColorForLevel(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG: return '#888';
            case LogLevel.INFO: return '#00ff00';
            case LogLevel.WARN: return '#ffaa00';
            case LogLevel.ERROR: return '#ff0000';
            default: return '#00ff00';
        }
    }

    private log(level: LogLevel, category: string, message: string, data?: any): void {
        if (level < this.logLevel) return;

        const logEntry = {
            timestamp: Date.now(),
            level,
            category,
            message,
            data
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output with color
        const color = this.getColorForLevel(level);
        const levelName = LogLevel[level];
        const consoleMsg = `%c[${category}] ${message}`;

        console.log(consoleMsg, `color: ${color}; font-weight: bold;`, data || '');

        // Update debug panel
        this.updateDebugPanel();
    }

    public debug(category: string, message: string, data?: any): void {
        this.log(LogLevel.DEBUG, category, message, data);
    }

    public info(category: string, message: string, data?: any): void {
        this.log(LogLevel.INFO, category, message, data);
    }

    public warn(category: string, message: string, data?: any): void {
        this.log(LogLevel.WARN, category, message, data);
    }

    public error(category: string, message: string, data?: any): void {
        this.log(LogLevel.ERROR, category, message, data);
    }

    // Helper for timing operations
    public time(category: string, label: string): void {
        console.time(`[${category}] ${label}`);
        this.debug(category, `⏱️ START: ${label}`);
    }

    public timeEnd(category: string, label: string): void {
        console.timeEnd(`[${category}] ${label}`);
        this.info(category, `✅ DONE: ${label}`);
    }

    // Get all logs for export/debugging
    public getAllLogs(): any[] {
        return this.logs;
    }

    public exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    public clearLogs(): void {
        this.logs = [];
        if (this.debugPanel) {
            this.debugPanel.innerHTML = '<div>Logs cleared</div>';
        }
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
        this.info('Logger', `Log level set to ${LogLevel[level]}`);
    }
}

// Export singleton instance
export const logger = Logger.getInstance();
