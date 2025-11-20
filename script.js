class RasterVisualizer {
    constructor() {
        this.canvas = document.getElementById('grid-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.scale = 2;
        this.currentPixels = [];
        this.isDrawing = false;
        this.startPoint = null;
        
        this.initializeEventListeners();
        this.drawGrid();
        this.updateAlgorithmDescription();
    }

    initializeEventListeners() {
        document.getElementById('draw-btn').addEventListener('click', () => this.drawAlgorithm());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('algorithm').addEventListener('change', (e) => this.onAlgorithmChange(e));
        document.getElementById('scale').addEventListener('input', (e) => this.onScaleChange(e));
        document.getElementById('grid-size').addEventListener('change', (e) => this.onGridSizeChange(e));

        // Обработчики для рисования мышью
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    onAlgorithmChange(e) {
        const algorithm = e.target.value;
        const radiusGroup = document.getElementById('radius-group');
        
        if (algorithm === 'bresenham_circle') {
            radiusGroup.style.display = 'block';
        } else {
            radiusGroup.style.display = 'none';
        }
        
        this.updateAlgorithmDescription();
    }

    onScaleChange(e) {
        this.scale = parseInt(e.target.value);
        document.getElementById('scale-value').textContent = `${this.scale}x`;
        this.redraw();
    }

    onGridSizeChange(e) {
        this.gridSize = parseInt(e.target.value);
        this.redraw();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const gridX = Math.floor(x / (this.gridSize * this.scale));
        const gridY = Math.floor(y / (this.gridSize * this.scale));
        
        return { gridX, gridY, canvasX: x, canvasY: y };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.startPoint = { x: pos.gridX, y: pos.gridY };
        this.isDrawing = true;
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        this.drawTemporaryLine(this.startPoint, { x: pos.gridX, y: pos.gridY });
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        const endPoint = { x: pos.gridX, y: pos.gridY };
        
        // Устанавливаем координаты в поля ввода
        document.getElementById('x1').value = this.startPoint.x;
        document.getElementById('y1').value = this.startPoint.y;
        
        const algorithm = document.getElementById('algorithm').value;
        if (algorithm === 'bresenham_circle') {
            const radius = Math.max(
                Math.abs(endPoint.x - this.startPoint.x),
                Math.abs(endPoint.y - this.startPoint.y)
            );
            document.getElementById('radius').value = radius;
        } else {
            document.getElementById('x2').value = endPoint.x;
            document.getElementById('y2').value = endPoint.y;
        }
        
        this.drawAlgorithm();
        this.isDrawing = false;
        this.startPoint = null;
    }

    drawTemporaryLine(start, end) {
        this.clearCanvas();
        this.drawGrid();
        
        const algorithm = document.getElementById('algorithm').value;
        let pixels = [];
        
        if (algorithm === 'bresenham_circle') {
            const radius = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
            pixels = this.simulateBresenhamCircle(start, radius);
        } else {
            pixels = this.simulateBresenhamLine(start, end);
        }
        
        this.drawPixels(pixels, '#667eea');
    }

    simulateBresenhamLine(p1, p2) {
        const pixels = [];
        let x1 = p1.x, y1 = p1.y;
        let x2 = p2.x, y2 = p2.y;
        
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = (x1 < x2) ? 1 : -1;
        const sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;
        
        while(true) {
            pixels.push([x1, y1]);
            if (x1 === x2 && y1 === y2) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
        
        return pixels;
    }

    simulateBresenhamCircle(center, radius) {
        const pixels = [];
        let x = 0;
        let y = radius;
        let d = 3 - 2 * radius;
        
        const drawCirclePoints = (xc, yc, x, y) => {
            return [
                [xc + x, yc + y], [xc - x, yc + y],
                [xc + x, yc - y], [xc - x, yc - y],
                [xc + y, yc + x], [xc - y, yc + x],
                [xc + y, yc - x], [xc - y, yc - x]
            ];
        };
        
        pixels.push(...drawCirclePoints(center.x, center.y, x, y));
        
        while (y >= x) {
            x++;
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
            pixels.push(...drawCirclePoints(center.x, center.y, x, y));
        }
        
        return pixels;
    }

    drawAlgorithm() {
        const algorithm = document.getElementById('algorithm').value;
        const x1 = parseInt(document.getElementById('x1').value);
        const y1 = parseInt(document.getElementById('y1').value);
        const x2 = parseInt(document.getElementById('x2').value);
        const y2 = parseInt(document.getElementById('y2').value);
        const radius = parseInt(document.getElementById('radius').value);

        const startTime = performance.now();
        
        let pixels = [];
        let computations = {};
        
        switch(algorithm) {
            case 'step_by_step':
                pixels = this.stepByStepLine({x: x1, y: y1}, {x: x2, y: y2});
                computations = this.getStepByStepComputations({x: x1, y: y1}, {x: x2, y: y2});
                break;
            case 'dda':
                pixels = this.ddaLine({x: x1, y: y1}, {x: x2, y: y2});
                computations = this.getDDAComputations({x: x1, y: y1}, {x: x2, y: y2});
                break;
            case 'bresenham_line':
                pixels = this.bresenhamLine({x: x1, y: y1}, {x: x2, y: y2});
                computations = this.getBresenhamLineComputations({x: x1, y: y1}, {x: x2, y: y2});
                break;
            case 'bresenham_circle':
                pixels = this.bresenhamCircle({x: x1, y: y1}, radius);
                computations = this.getBresenhamCircleComputations({x: x1, y: y1}, radius);
                break;
            case 'castel_pitway':
                pixels = this.castelPitwayLine({x: x1, y: y1}, {x: x2, y: y2});
                computations = this.getCastelPitwayComputations({x: x1, y: y1}, {x: x2, y: y2});
                break;
            case 'wu_smooth':
                pixels = this.wuLine({x: x1, y: y1}, {x: x2, y: y2});
                computations = this.getWuComputations({x: x1, y: y1}, {x: x2, y: y2});
                break;
        }
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        this.currentPixels = pixels;
        this.redraw();
        
        // Обновляем информацию
        document.getElementById('execution-time').textContent = 
            `Время выполнения: ${executionTime.toFixed(3)} мс`;
        document.getElementById('pixels-count').textContent = 
            `Количество пикселей: ${pixels.length}`;
        document.getElementById('computations-text').textContent = 
            JSON.stringify(computations, null, 2);
    }

    stepByStepLine(p1, p2) {
        const pixels = [];
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        
        if (x1 === x2) {
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                pixels.push([x1, y]);
            }
            return pixels;
        }
        
        const k = (y2 - y1) / (x2 - x1);
        const b = y1 - k * x1;
        
        if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                const y = Math.round(k * x + b);
                pixels.push([x, y]);
            }
        } else {
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                const x = Math.round((y - b) / k);
                pixels.push([x, y]);
            }
        }
        
        return pixels;
    }

    ddaLine(p1, p2) {
        const pixels = [];
        let x1 = p1.x, y1 = p1.y;
        let x2 = p2.x, y2 = p2.y;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        if (steps === 0) {
            return [[x1, y1]];
        }
        
        const xInc = dx / steps;
        const yInc = dy / steps;
        
        let x = x1;
        let y = y1;
        
        for (let i = 0; i <= steps; i++) {
            pixels.push([Math.round(x), Math.round(y)]);
            x += xInc;
            y += yInc;
        }
        
        return pixels;
    }

    bresenhamLine(p1, p2) {
        const pixels = [];
        let x1 = p1.x, y1 = p1.y;
        let x2 = p2.x, y2 = p2.y;
        
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        
        let err = dx - dy;
        
        while (true) {
            pixels.push([x1, y1]);
            if (x1 === x2 && y1 === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
        
        return pixels;
    }

    bresenhamCircle(center, radius) {
        const pixels = [];
        let x = 0;
        let y = radius;
        let d = 3 - 2 * radius;
        
        const drawCirclePoints = (xc, yc, x, y) => {
            return [
                [xc + x, yc + y], [xc - x, yc + y],
                [xc + x, yc - y], [xc - x, yc - y],
                [xc + y, yc + x], [xc - y, yc + x],
                [xc + y, yc - x], [xc - y, yc - x]
            ];
        };
        
        pixels.push(...drawCirclePoints(center.x, center.y, x, y));
        
        while (y >= x) {
            x++;
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
            pixels.push(...drawCirclePoints(center.x, center.y, x, y));
        }
        
        const uniquePixels = [];
        const seen = new Set();
        pixels.forEach(pixel => {
            const key = pixel.join(',');
            if (!seen.has(key)) {
                seen.add(key);
                uniquePixels.push(pixel);
            }
        });
        
        return uniquePixels;
    }

    castelPitwayLine(p1, p2) {
    const pixels = [];
    let x1 = p1.x, y1 = p1.y;
    let x2 = p2.x, y2 = p2.y;
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    let x = x1;
    let y = y1;
    
    const xInc = (x1 < x2) ? 1 : -1;
    const yInc = (y1 < y2) ? 1 : -1;
    
    if (dx >= dy) {
        let d = 2 * dy - dx;
        let deltaE = 2 * dy;
        let deltaNE = 2 * (dy - dx);
        
        pixels.push([x, y]);
        
        for (let i = 0; i < dx; i++) {
            if (d <= 0) {
                d += deltaE;
                x += xInc;
            } else {
                d += deltaNE;
                x += xInc;
                y += yInc;
            }
            pixels.push([x, y]);
        }
    } else {
        let d = 2 * dx - dy;
        let deltaN = 2 * dx;
        let deltaNE = 2 * (dx - dy);
        
        pixels.push([x, y]);
        
        for (let i = 0; i < dy; i++) {
            if (d <= 0) {
                d += deltaN;
                y += yInc;
            } else {
                d += deltaNE;
                x += xInc;
                y += yInc;
            }
            pixels.push([x, y]);
        }
    }
    
    return pixels;
}

    wuLine(p1, p2) {
    const result = [];
    let x1 = p1.x, y1 = p1.y;
    let x2 = p2.x, y2 = p2.y;
    
    const plot = (x, y, intensity) => {
        result.push([[x, y], Math.min(1, Math.max(0, intensity))]);
    };
    
    const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    
    if (steep) {
        [x1, y1] = [y1, x1];
        [x2, y2] = [y2, x2];
    }
    
    if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [y1, y2] = [y2, y1];
    }
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (dx === 0) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            plot(x1, y, 1);
        }
        return result;
    }
    
    const gradient = dy / dx;
    
    let xend = Math.round(x1);
    let yend = y1 + gradient * (xend - x1);
    let xgap = 1 - (x1 + 0.5) % 1;
    let xpxl1 = xend;
    let ypxl1 = Math.floor(yend);
    
    if (steep) {
        plot(ypxl1, xpxl1, (1 - (yend % 1)) * xgap);
        plot(ypxl1 + 1, xpxl1, (yend % 1) * xgap);
    } else {
        plot(xpxl1, ypxl1, (1 - (yend % 1)) * xgap);
        plot(xpxl1, ypxl1 + 1, (yend % 1) * xgap);
    }
    
    let intery = yend + gradient;
    
    xend = Math.round(x2);
    yend = y2 + gradient * (xend - x2);
    xgap = (x2 + 0.5) % 1;
    let xpxl2 = xend;
    let ypxl2 = Math.floor(yend);
    
    if (steep) {
        plot(ypxl2, xpxl2, (1 - (yend % 1)) * xgap);
        plot(ypxl2 + 1, xpxl2, (yend % 1) * xgap);
    } else {
        plot(xpxl2, ypxl2, (1 - (yend % 1)) * xgap);
        plot(xpxl2, ypxl2 + 1, (yend % 1) * xgap);
    }
    
    if (steep) {
        for (let x = xpxl1 + 1; x < xpxl2; x++) {
            plot(Math.floor(intery), x, 1 - (intery % 1));
            plot(Math.floor(intery) + 1, x, intery % 1);
            intery += gradient;
        }
    } else {
        for (let x = xpxl1 + 1; x < xpxl2; x++) {
            plot(x, Math.floor(intery), 1 - (intery % 1));
            plot(x, Math.floor(intery) + 1, intery % 1);
            intery += gradient;
        }
    }
    
    return result;
}

    getStepByStepComputations(p1, p2) {
        const k = (p2.y - p1.y) / (p2.x - p1.x);
        const b = p1.y - k * p1.x;
        return {
            algorithm: "Пошаговый алгоритм",
            slope: k,
            intercept: b,
            formula: `y = ${k.toFixed(4)}x + ${b.toFixed(4)}`
        };
    }

    getDDAComputations(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        return {
            algorithm: "Алгоритм ЦДА",
            dx: dx,
            dy: dy,
            steps: steps,
            x_increment: (dx / steps).toFixed(4),
            y_increment: (dy / steps).toFixed(4)
        };
    }

    getBresenhamLineComputations(p1, p2) {
        const dx = Math.abs(p2.x - p1.x);
        const dy = Math.abs(p2.y - p1.y);
        return {
            algorithm: "Алгоритм Брезенхема (линия)",
            dx: dx,
            dy: dy,
            initial_error: 2 * dy - dx
        };
    }

    getBresenhamCircleComputations(center, radius) {
        return {
            algorithm: "Алгоритм Брезенхема (окружность)",
            center: `(${center.x}, ${center.y})`,
            radius: radius,
            initial_decision_parameter: 3 - 2 * radius
        };
    }

    getCastelPitwayComputations(p1, p2) {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    
    if (dx >= dy) {
        return {
            algorithm: "Алгоритм Кастла-Питвея",
            type: "Горизонтальная линия",
            dx: dx,
            dy: dy,
            initial_decision: 2 * dy - dx,
            deltaE: 2 * dy,
            deltaNE: 2 * (dy - dx)
        };
    } else {
        return {
            algorithm: "Алгоритм Кастла-Питвея", 
            type: "Вертикальная линия",
            dx: dx,
            dy: dy,
            initial_decision: 2 * dx - dy,
            deltaN: 2 * dx,
            deltaNE: 2 * (dx - dy)
        };
    }
}

getWuComputations(p1, p2) {
    const steep = Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x);
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const gradient = dx === 0 ? 0 : dy / dx;
    
    return {
        algorithm: "Алгоритм Ву (сглаживание)",
        steep: steep,
        dx: dx,
        dy: dy,
        gradient: gradient.toFixed(4),
        features: "Антиалиасинг через суперсэмплинг и интенсивность пикселей"
    };
}

    drawGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cellSize = this.gridSize * this.scale;
        
        ctx.clearRect(0, 0, width, height);
        
        // Рисуем сетку
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= width; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Рисуем оси координат
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Подписи осей
        ctx.fillStyle = '#4a5568';
        ctx.font = '14px Arial';
        ctx.fillText('Y', width / 2 + 10, 20);
        ctx.fillText('X', width - 20, height / 2 - 10);
        
        // Подписи координат
        ctx.fillStyle = '#718096';
        ctx.font = '12px Arial';
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let i = -10; i <= 10; i++) {
            if (i === 0) continue;
            
            const x = centerX + i * cellSize;
            const y = centerY + i * cellSize;
            
            // Подписи по оси X
            ctx.fillText(i.toString(), x - 5, centerY - 5);
            
            // Подписи по оси Y
            ctx.fillText((-i).toString(), centerX + 5, y + 5);
        }
        
        // Ноль
        ctx.fillText('0', centerX - 10, centerY + 15);
    }

   drawPixels(pixels, color = '#e53e3e') {
    const ctx = this.ctx;
    const cellSize = this.gridSize * this.scale;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    pixels.forEach(pixel => {
        let x, y, intensity;
        
        if (Array.isArray(pixel[0])) {
            // Для алгоритма Ву (пиксель с интенсивностью)
            [x, y] = pixel[0];
            intensity = pixel[1];
            // Используем интенсивность для альфа-канала
            const alpha = Math.floor(intensity * 255);
            ctx.fillStyle = `rgba(229, 62, 62, ${intensity})`;
        } else {
            // Обычные пиксели
            [x, y] = pixel;
            intensity = 1;
            ctx.fillStyle = color;
        }
        
        const canvasX = centerX + x * cellSize;
        const canvasY = centerY - y * cellSize;
        
        ctx.fillRect(canvasX, canvasY, cellSize, cellSize);
        
        // Обводка для лучшей видимости (только для обычных пикселей)
        if (intensity === 1) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(canvasX, canvasY, cellSize, cellSize);
        }
    });
}
    redraw() {
        this.drawGrid();
        if (this.currentPixels.length > 0) {
            this.drawPixels(this.currentPixels);
        }
    }

    clearCanvas() {
        this.currentPixels = [];
        this.drawGrid();
        
        document.getElementById('execution-time').textContent = 'Время выполнения: -';
        document.getElementById('pixels-count').textContent = 'Количество пикселей: -';
        document.getElementById('computations-text').textContent = '-';
    }

    updateAlgorithmDescription() {
        const algorithm = document.getElementById('algorithm').value;
        const descriptionElement = document.getElementById('algorithm-description');
        
        const descriptions = {
            step_by_step: `
                <h4>Пошаговый алгоритм</h4>
                <p><strong>Принцип работы:</strong> Вычисление координат пикселей на основе уравнения прямой.</p>
                <p><strong>Формула:</strong> y = kx + b, где k = (y2-y1)/(x2-x1), b = y1 - k*x1</p>
                <p><strong>Пример вычислений для точек (2,3) и (14,8):</strong></p>
                <ul>
                    <li>k = (8-3)/(14-2) = 5/12 ≈ 0.4167</li>
                    <li>b = 3 - 0.4167*2 ≈ 2.1667</li>
                    <li>Для x=2: y = 0.4167*2 + 2.1667 ≈ 3 (округляем)</li>
                    <li>Для x=3: y = 0.4167*3 + 2.1667 ≈ 3.4167 → 3</li>
                </ul>
                <p><strong>Сложность:</strong> O(max(|Δx|, |Δy|))</p>
            `,
            dda: `
                <h4>Алгоритм ЦДА (Цифровой Дифференциальный Анализатор)</h4>
                <p><strong>Принцип работы:</strong> Постепенное увеличение координат с постоянным шагом.</p>
                <p><strong>Формулы:</strong></p>
                <ul>
                    <li>steps = max(|Δx|, |Δy|)</li>
                    <li>x_inc = Δx / steps</li>
                    <li>y_inc = Δy / steps</li>
                </ul>
                <p><strong>Пример для точек (2,3) и (14,8):</strong></p>
                <ul>
                    <li>Δx = 12, Δy = 5</li>
                    <li>steps = max(12,5) = 12</li>
                    <li>x_inc = 12/12 = 1</li>
                    <li>y_inc = 5/12 ≈ 0.4167</li>
                </ul>
                <p><strong>Сложность:</strong> O(max(|Δx|, |Δy|))</p>
            `,
            bresenham_line: `
                <h4>Алгоритм Брезенхема (линия)</h4>
                <p><strong>Принцип работы:</strong> Использование целочисленной арифметики для выбора следующего пикселя.</p>
                <p><strong>Ключевые параметры:</strong></p>
                <ul>
                    <li>dx = |x2 - x1|</li>
                    <li>dy = |y2 - y1|</li>
                    <li>error = 2*dy - dx</li>
                </ul>
                <p><strong>Пример для точек (2,3) и (14,8):</strong></p>
                <ul>
                    <li>dx = 12, dy = 5</li>
                    <li>Начальное error = 2*5 - 12 = -2</li>
                    <li>При error < 0: error += 2*dy = 10</li>
                    <li>При error ≥ 0: error += 2*(dy-dx) = 2*(5-12) = -14</li>
                </ul>
                <p><strong>Сложность:</strong> O(max(|Δx|, |Δy|))</p>
            `,
            bresenham_circle: `
                <h4>Алгоритм Брезенхема (окружность)</h4>
                <p><strong>Принцип работы:</strong> Построение 1/8 окружности и симметричное отображение.</p>
                <p><strong>Ключевые параметры:</strong></p>
                <ul>
                    <li>Начальное: x=0, y=R</li>
                    <li>d = 3 - 2*R</li>
                </ul>
                <p><strong>Пример для центра (0,0) и R=5:</strong></p>
                <ul>
                    <li>Начальное: x=0, y=5, d=3-10=-7</li>
                    <li>Шаг 1: x=1, d=-7+4*1+6=3</li>
                    <li>Шаг 2: x=2, d=3+4*2+6=17</li>
                    <li>При d>0: y=4, d=17+4*(2-4)+10=17-8+10=19</li>
                </ul>
                <p><strong>Сложность:</strong> O(R)</p>
            `,
            castel_pitway: `
                <h4>Алгоритм Кастла-Питвея</h4>
                <p><strong>Принцип работы:</strong> Модификация алгоритма Брезенхема с улучшенной обработкой градиентов.</p>
                <p><strong>Особенности:</strong></p>
                <ul>
                    <li>Использует два параметра ошибки</li>
                    <li>Более равномерное распределение пикселей</li>
                    <li>Лучше работает для линий с малыми углами</li>
                </ul>
                <p><strong>Сложность:</strong> O(max(|Δx|, |Δy|))</p>
            `,
            wu_smooth: `
                <h4>Алгоритм Ву (сглаживание)</h4>
                <p><strong>Принцип работы:</strong> Антиалиасинг через рисование пикселей с разной интенсивностью.</p>
                <p><strong>Особенности:</strong></p>
                <ul>
                    <li>Пиксели рисуются с прозрачностью</li>
                    <li>Использует дробные части координат</li>
                    <li>Создает эффект сглаживания</li>
                </ul>
                <p><strong>Сложность:</strong> O(max(|Δx|, |Δy|))</p>
            `
        };
        
        descriptionElement.innerHTML = descriptions[algorithm] || '<p>Описание алгоритма не найдено.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RasterVisualizer();
});