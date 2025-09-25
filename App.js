import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, PanResponder, Dimensions, ImageBackground } from 'react-native';
import { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [gridLayout, setGridLayout] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState([]);

  // 3x3 grid indices 1..9 laid out as:
  // 1 2 3
  // 4 5 6
  // 7 8 9
  const grid = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], []);
  const correctPattern = useMemo(() => [2, 6, 8, 4, 2], []);

  const getDotCoordinates = (idx) => {
    const { width, height } = gridLayout;
    if (!width || !height) return { x: 0, y: 0 };
    const cellW = width / 3;
    const cellH = height / 3;
    const row = Math.floor((idx - 1) / 3);
    const col = (idx - 1) % 3;
    return {
      x: col * cellW + cellW / 2,
      y: row * cellH + cellH / 2,
    };
  };

  const addPointFromCoord = (x, y) => {
    const { width, height } = gridLayout;
    if (!width || !height) return;
    const cellW = width / 3;
    const cellH = height / 3;
    const col = Math.max(0, Math.min(2, Math.floor(x / cellW)));
    const row = Math.max(0, Math.min(2, Math.floor(y / cellH)));
    const idx = row * 3 + col + 1; // 1..9
    setSelected((prev) => {
      if (prev[prev.length - 1] === idx) return prev;
      return [...prev, idx];
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setError('');
        setSelected([]);
        const { locationX, locationY } = evt.nativeEvent;
        addPointFromCoord(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        addPointFromCoord(locationX, locationY);
      },
      onPanResponderRelease: () => {
        const isMatch = selected.length === correctPattern.length && selected.every((v, i) => v === correctPattern[i]);
        if (isMatch) {
          setUnlocked(true);
          setError('');
        } else {
          setError('Incorrect pattern. Try again.');
          setTimeout(() => setSelected([]), 500);
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const handleTorchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Toggle torch functionality would go here
  };

  const handleCameraPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Camera functionality would go here
  };

  const Line = ({ start, end }) => {
    if (!start || !end) return null;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return (
      <View
        style={{
          position: 'absolute',
          left: start.x,
          top: start.y,
          width: length,
          height: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: '0 0',
        }}
      />
    );
  };

  return (
    <ImageBackground 
      source={require('./assets/taxi.jpg')} 
      style={styles.screen}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.lockArea}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={28} color="#fff" />
        </View>
        <Text style={styles.time}>12:45</Text>
        <Text style={styles.date}>Thursday, September 25</Text>
      </View>

      {!unlocked ? (
        <View style={styles.patternArea}>
          <View style={styles.gridWrapper}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View
              style={styles.gridContainer}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setGridLayout({ width, height });
              }}
              {...panResponder.panHandlers}
            >
              {grid.map((n) => {
                const isActive = selected.includes(n);
                return (
                  <View key={n} style={styles.dotWrapper}>
                    <View style={[styles.dot, isActive && styles.dotActive]} />
                  </View>
                );
              })}
              {selected.map((n, i) => {
                if (i === 0) return null;
                const start = getDotCoordinates(selected[i - 1]);
                const end = getDotCoordinates(n);
                return <Line key={`${i}-${n}`} start={start} end={end} />;
              })}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.unlockedArea}>
          <Text style={styles.unlockedText}>Phone Unlocked</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.iconButton}
          activeOpacity={0.8}
          onPress={handleTorchPress}
        >
          <Ionicons name="flashlight" size={28} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, { marginLeft: 'auto' }]}
          activeOpacity={0.8}
          onPress={handleCameraPress}
        >
          <Ionicons name="camera" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.7)',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  lockArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lockIcon: {
    fontSize: 36,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  time: {
    fontSize: 90,
    color: '#e2e8f0',
    fontWeight: '400',
  },
  date: {
    marginTop: 6,
    fontSize: 16,
    color: '#94a3b8',
  },
  patternArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    paddingBottom: 70,
  },
  instruction: {
    color: '#cbd5e1',
    marginBottom: 12,
  },
  errorText: {
    position: 'absolute',
    top: -40,
    color: '#fca5a5',
    textAlign: 'center',
    width: '100%',
  },
  gridWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  gridContainer: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 15,
  },
  dotWrapper: {
    width: '33.3333%',
    height: '33.3333%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  unlockedArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedText: {
    color: '#22c55e',
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 12,
  },
  lockIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});