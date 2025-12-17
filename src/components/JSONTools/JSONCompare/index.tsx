import React, { useState } from 'react';
import './index.css';

interface DiffResult {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
}

const JSONCompare: React.FC = () => {
  const [json1, setJson1] = useState<string>('');
  const [json2, setJson2] = useState<string>('');
  const [diffs, setDiffs] = useState<DiffResult[]>([]);
  const [error, setError] = useState<string>('');

  // 比较两个JSON对象
  const compareJSON = (obj1: any, obj2: any, path: string = ''): DiffResult[] => {
    const differences: DiffResult[] = [];

    // 获取所有键的并集
    const allKeys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {}),
    ]);

    allKeys.forEach((key) => {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      // 如果键在obj1中不存在，说明是新增的
      if (!(key in (obj1 || {}))) {
        differences.push({
          path: currentPath,
          type: 'added',
          newValue: val2,
        });
      }
      // 如果键在obj2中不存在，说明是删除的
      else if (!(key in (obj2 || {}))) {
        differences.push({
          path: currentPath,
          type: 'removed',
          oldValue: val1,
        });
      }
      // 如果两个值都是对象，递归比较
      else if (
        typeof val1 === 'object' &&
        val1 !== null &&
        !Array.isArray(val1) &&
        typeof val2 === 'object' &&
        val2 !== null &&
        !Array.isArray(val2)
      ) {
        differences.push(...compareJSON(val1, val2, currentPath));
      }
      // 如果两个值都是数组，比较数组
      else if (Array.isArray(val1) && Array.isArray(val2)) {
        const maxLength = Math.max(val1.length, val2.length);
        for (let i = 0; i < maxLength; i++) {
          const arrayPath = `${currentPath}[${i}]`;
          if (i >= val1.length) {
            differences.push({
              path: arrayPath,
              type: 'added',
              newValue: val2[i],
            });
          } else if (i >= val2.length) {
            differences.push({
              path: arrayPath,
              type: 'removed',
              oldValue: val1[i],
            });
          } else if (
            typeof val1[i] === 'object' &&
            val1[i] !== null &&
            !Array.isArray(val1[i]) &&
            typeof val2[i] === 'object' &&
            val2[i] !== null &&
            !Array.isArray(val2[i])
          ) {
            differences.push(...compareJSON(val1[i], val2[i], arrayPath));
          } else if (JSON.stringify(val1[i]) !== JSON.stringify(val2[i])) {
            differences.push({
              path: arrayPath,
              type: 'modified',
              oldValue: val1[i],
              newValue: val2[i],
            });
          }
        }
      }
      // 比较基本值
      else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          path: currentPath,
          type: 'modified',
          oldValue: val1,
          newValue: val2,
        });
      }
    });

    return differences;
  };

  // 处理比对
  const handleCompare = () => {
    if (!json1.trim() || !json2.trim()) {
      setError('请输入两组JSON字符串');
      setDiffs([]);
      return;
    }

    try {
      setError('');
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);

      const differences = compareJSON(obj1, obj2);
      setDiffs(differences);

      if (differences.length === 0) {
        alert('✅ 两个JSON完全相同');
      }
    } catch (err) {
      setError(`JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setDiffs([]);
    }
  };

  // 格式化值显示
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // 清空
  const clearAll = () => {
    setJson1('');
    setJson2('');
    setDiffs([]);
    setError('');
  };

  return (
    <div className="json-compare">
      <div className="compare-controls">
        <button onClick={handleCompare} className="compare-btn">
          开始比对
        </button>
        <button onClick={clearAll} className="clear-btn">
          清空
        </button>
      </div>

      <div className="json-inputs">
        <div className="json-input-group">
          <div className="section-header">
            <label>JSON 1：</label>
          </div>
          <textarea
            value={json1}
            onChange={(e) => setJson1(e.target.value)}
            placeholder="请输入第一组JSON..."
            className="json-textarea"
          />
        </div>

        <div className="json-input-group">
          <div className="section-header">
            <label>JSON 2：</label>
          </div>
          <textarea
            value={json2}
            onChange={(e) => setJson2(e.target.value)}
            placeholder="请输入第二组JSON..."
            className="json-textarea"
          />
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {diffs.length > 0 && (
        <div className="diff-results">
          <div className="section-header">
            <label>差异结果（共 {diffs.length} 处）：</label>
          </div>
          <div className="diff-list">
            {diffs.map((diff, index) => (
              <div key={index} className={`diff-item ${diff.type}`}>
                <div className="diff-path">
                  <span className="diff-type-badge">{diff.type === 'added' ? '新增' : diff.type === 'removed' ? '删除' : '修改'}</span>
                  <span className="diff-path-text">{diff.path}</span>
                </div>
                {diff.type === 'removed' && (
                  <div className="diff-value removed">
                    <span className="diff-label">旧值：</span>
                    <pre>{formatValue(diff.oldValue)}</pre>
                  </div>
                )}
                {diff.type === 'added' && (
                  <div className="diff-value added">
                    <span className="diff-label">新值：</span>
                    <pre>{formatValue(diff.newValue)}</pre>
                  </div>
                )}
                {diff.type === 'modified' && (
                  <>
                    <div className="diff-value removed">
                      <span className="diff-label">旧值：</span>
                      <pre>{formatValue(diff.oldValue)}</pre>
                    </div>
                    <div className="diff-value added">
                      <span className="diff-label">新值：</span>
                      <pre>{formatValue(diff.newValue)}</pre>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JSONCompare;

