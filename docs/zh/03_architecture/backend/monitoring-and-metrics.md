# 监控和指标实现

## 概述

成功为Timeline Studio后端服务层实现了全面的监控和日志系统。

## 新增内容

### 1. 监控模块 (`services/monitoring.rs`)
- **ServiceMetrics**: 跟踪单个服务的指标
- **OperationMetrics**: 每个操作的详细指标，包括：
  - 操作计数
  - 总计/最小/最大/平均持续时间
  - 错误计数和最后错误消息
  - 最后操作时间戳
- **OperationTracker**: 自动操作计时跟踪
- **MetricsRegistry**: 所有服务指标的全局注册表
- **Prometheus导出**: 以Prometheus格式导出指标

### 2. 服务集成
- 向`ServiceContainer`添加了`ServiceMetricsContainer`
- 每个服务自动注册指标
- 服务可以使用`metrics.start_operation()`跟踪操作

### 3. 示例实现 (`cache_service_with_metrics.rs`)
演示如何使用自动指标收集包装任何服务：
```rust
let tracker = self.metrics.start_operation("clear_all");
match self.inner.clear_all().await {
  Ok(result) => {
    tracker.complete().await;
    log::info!("[CacheService] 缓存清理成功");
    Ok(result)
  }
  Err(e) => {
    tracker.fail(e.to_string()).await;
    log::error!("[CacheService] 缓存清理错误: {}", e);
    Err(e)
  }
}
```

### 4. 指标命令 (`commands/metrics.rs`)
添加了用于指标访问的Tauri命令：
- `get_all_metrics` - 获取所有服务的指标
- `get_service_metrics` - 获取特定服务的指标
- `export_metrics_prometheus` - 以Prometheus格式导出
- `reset_service_metrics` - 重置服务指标
- `get_active_operations_count` - 获取活动操作计数
- `get_error_statistics` - 获取详细错误统计
- `get_slow_operations` - 获取最慢的操作

### 5. 集成点
- 命令在`lib.rs`中注册
- 指标可通过Tauri命令从前端访问
- 使用`once_cell::Lazy`的全局`METRICS`注册表

## 使用示例

### 从服务代码中：
```rust
// 开始跟踪操作
let tracker = self.metrics.start_operation("generate_preview");

// 执行工作
let result = generate_preview_internal().await;

// 根据结果完成或失败
match result {
  Ok(data) => {
    tracker.complete().await;
    Ok(data)
  }
  Err(e) => {
    tracker.fail(e.to_string()).await;
    Err(e)
  }
}
```

### 从前端：
```javascript
// 获取所有指标
const metrics = await invoke('get_all_metrics');

// 获取特定服务指标
const cacheMetrics = await invoke('get_service_metrics', { 
  serviceName: 'cache-service' 
});

// 获取错误统计
const errors = await invoke('get_error_statistics');

// 导出Prometheus指标
const prometheusData = await invoke('export_metrics_prometheus');
```

## 优势

1. **性能监控**: 跟踪操作持续时间并识别瓶颈
2. **错误跟踪**: 监控错误率和模式
3. **资源使用**: 跟踪活动操作和服务负载
4. **生产洞察**: 为监控系统导出指标
5. **调试**: 带时间戳的详细操作历史

## 可用指标

对于每个服务：
- 总操作计数
- 总错误计数
- 活动操作计数
- 每秒操作数
- 错误率
- 运行时间

对于每个操作：
- 执行计数
- 最小/最大/平均持续时间
- 错误计数
- 最后错误消息
- 最后执行时间

## 扩展指标实现 ✅

### 1. 缓存性能指标 (`advanced_metrics.rs`)
添加了全面的缓存监控，包括：
- **命中率分析**: 最近一小时/一天的统计
- **内存使用跟踪**: 峰值和当前使用量
- **性能监控**: 响应时间和慢操作
- **警报系统**: 关键指标的可配置阈值

```rust
// 获取详细的缓存性能
let metrics = invoke('get_cache_performance_metrics').await;

// 设置警报阈值
await invoke('set_cache_alert_thresholds', {
  thresholds: {
    min_hit_rate: 0.8,
    max_memory_usage_mb: 512.0,
    max_response_time_ms: 100.0,
    max_fragmentation: 0.3
  }
});

// 检查活动警报
let alerts = await invoke('get_cache_alerts');
```

### 2. GPU使用指标
实时GPU监控，包括：
- GPU利用率百分比
- 内存使用（已用/总计）
- 温度和功耗
- 活动编码会话
- 性能指标（编码FPS、队列长度）

### 3. 内存使用分析
跨服务跟踪内存：
- 每个服务的内存消耗
- 峰值使用和分配模式
- 内存警报和垃圾收集统计
- 碎片分析

### 4. 历史趋势分析
存储和分析随时间变化的指标：
- 可配置的时间范围（小时/天）
- 统计摘要（最小/最大/平均）
- 性能趋势识别
- 容量规划洞察

### 5. 灵活的警报系统
警报框架，包括：
- 自定义指标阈值
- 多个严重级别（信息/警告/严重）
- 警报历史和跟踪
- 准备好集成通知系统

## 新增高级命令

| 命令 | 目的 | 输出 |
|---------|---------|--------|
| `get_cache_performance_metrics` | 详细缓存分析 | 命中率、内存使用、慢操作 |
| `set_cache_alert_thresholds` | 配置警报阈值 | 设置监控限制 |
| `get_cache_alerts` | 活动警报状态 | 当前警报及严重程度 |
| `get_gpu_utilization_metrics` | GPU性能数据 | 使用率、内存、温度、编码 |
| `get_memory_usage_metrics` | 服务内存跟踪 | 按服务的内存消耗 |
| `create_custom_alert` | 创建自定义警报 | 用于跟踪的警报ID |
| `get_metrics_history` | 历史趋势数据 | 用于分析的时间序列指标 |

## 下一步

1. **仪表板集成**: 在前端创建指标仪表板 ⏳
2. **警报**: 为关键指标添加阈值和警报 ✅
3. **持久化**: 存储指标历史用于趋势分析 ✅
4. **自定义指标**: 添加服务特定指标（缓存命中率、GPU使用等） ✅
5. **性能优化**: 使用指标识别和优化慢操作 ✅

## 技术说明

- 使用`once_cell`进行延迟静态初始化
- 通过原子操作和RwLock实现线程安全
- 最小性能开销（每操作约微秒级）
- 通过Drop trait自动清理未完成的操作
- 使用Serde序列化进行前端通信