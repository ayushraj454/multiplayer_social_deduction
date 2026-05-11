import { useEffect, useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { createRoom, joinRoom, startGame, leaveRoom } from './lib/gameLogic';
import { supabase } from './lib/supabase';
import { sounds } from './lib/sounds';

type GameState = 'home' | 'lobby' | 'playing';

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [roomCode, setRoomCode] = useState('');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-status-${roomId}`, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.status === 'playing') {
            setGameState('playing');
          }
        }
      )
      .subscribe((status) => {
        console.log('Room status subscription:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const handleCreateRoom = async (playerName: string, avatar: string, skinColor: string) => {
    try {
      setError('');
      const { roomCode: code, roomId: rid, playerId: pid } = await createRoom(playerName, avatar, skinColor);
      setRoomCode(code);
      setRoomId(rid);
      setPlayerId(pid);
      setIsHost(true);
      setGameState('lobby');
    } catch (err) {
      sounds.error();
      setError(err instanceof Error ? err.message : 'Failed to create room');
      console.error(err);
    }
  };

  const handleJoinRoom = async (code: string, playerName: string, avatar: string, skinColor: string) => {
    try {
      setError('');
      const { playerId: pid, roomId: rid } = await joinRoom(code, playerName, avatar, skinColor);
      setRoomCode(code);
      setRoomId(rid);
      setPlayerId(pid);
      setIsHost(false);
      setGameState('lobby');
    } catch (err) {
      sounds.error();
      setError(err instanceof Error ? err.message : 'Failed to join room');
      console.error(err);
    }
  };

  const handleStartGame = async () => {
    try {
      setError('');
      await startGame(roomId);
      setGameState('playing');
    } catch (err) {
      sounds.error();
      setError(err instanceof Error ? err.message : 'Failed to start game');
      console.error(err);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(playerId);
      setGameState('home');
      setRoomCode('');
      setRoomId('');
      setPlayerId('');
      setIsHost(false);
      setError('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {gameState === 'home' && (
        <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}
      {gameState === 'lobby' && (
        <Lobby
          roomCode={roomCode}
          roomId={roomId}
          playerId={playerId}
          isHost={isHost}
          onStartGame={handleStartGame}
          onLeave={handleLeaveRoom}
        />
      )}
      {gameState === 'playing' && (
        <GameScreen roomId={roomId} playerId={playerId} onLeave={handleLeaveRoom} />
      )}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50">
          {error}
        </div>
      )}
    </>
  );
}

export default App;
