import React, { useState, memo, useCallback } from 'react';
import { Modal, Card, Space, Typography, Button } from 'antd';
import { CloseOutlined, RightOutlined } from '@ant-design/icons';
import './index.css';
import { games, GameConfig } from './games/gamesConfig';

const { Title, Paragraph, Text } = Typography;

interface EasterEggProps {
  onClose: () => void;
}

const EasterEgg: React.FC<EasterEggProps> = memo(({ onClose }) => {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);

  const handleGameClick = useCallback((game: GameConfig) => {
    setSelectedGame(game);
  }, []);

  const handleCloseGame = useCallback(() => {
    setSelectedGame(null);
  }, []);

  const GameComponent = selectedGame?.component;

  return (
    <Modal
      title={
        <Space>
          <span style={{ fontSize: '24px' }}>🎉</span>
          <Title level={3} style={{ margin: 0 }}>恭喜发现彩蛋！</Title>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnClose
      maskClosable={true}
      getContainer={() => document.body}
      closeIcon={<CloseOutlined />}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large" align="center">
        <Space direction="vertical" size="small" align="center">
          <Text style={{ fontSize: '48px' }}>🎊</Text>
          <Title level={4} style={{ margin: 0 }}>你找到了隐藏页面！</Title>
          <Paragraph type="secondary">看来你是一个细心的人，能够发现这个隐藏的彩蛋。</Paragraph>
        </Space>

        <Card title="🎮 小游戏" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {games.map((game) => (
              <Card
                key={game.id}
                hoverable
                style={{ cursor: 'pointer' }}
                onClick={() => handleGameClick(game)}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space size="middle">
                    <Text style={{ fontSize: '32px' }}>{game.icon}</Text>
                    <Space direction="vertical" size="small">
                      <Text strong>{game.name}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {game.description}
                      </Text>
                    </Space>
                  </Space>
                  <RightOutlined />
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        <Space direction="vertical" size="small" align="center">
          <Text strong>感谢使用工具箱！</Text>
          <Text type="secondary">选择一个游戏开始吧~</Text>
        </Space>
      </Space>

      {/* 游戏弹窗 */}
      {selectedGame && GameComponent && (
        <Modal
          title={
            <Space>
              <span style={{ fontSize: '20px' }}>{selectedGame.icon}</span>
              <Text strong>{selectedGame.name}</Text>
            </Space>
          }
          open={true}
          onCancel={handleCloseGame}
          footer={null}
          width={selectedGame.id === 'Snake' ? 600 : 800}
          centered
          destroyOnClose
          maskClosable={true}
          getContainer={() => document.body}
          closeIcon={<CloseOutlined />}
          style={{
            maxHeight: selectedGame.id === 'Snake' ? '90vh' : undefined,
          }}
          bodyStyle={{
            maxHeight: selectedGame.id === 'Snake' ? 'calc(90vh - 120px)' : undefined,
            overflowY: selectedGame.id === 'Snake' ? 'auto' : undefined,
          }}
        >
          <GameComponent />
        </Modal>
      )}
    </Modal>
  );
});

EasterEgg.displayName = 'EasterEgg';

export default EasterEgg;

