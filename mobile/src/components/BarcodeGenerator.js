import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export default function BarcodeGenerator({ value, width = 200, height = 50 }) {
  // Simple barcode pattern generator (Code 128 style)
  const generatePattern = (text) => {
    const patterns = [];
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      // Create alternating bar pattern based on character code
      const barCount = (char % 4) + 2;
      for (let j = 0; j < barCount; j++) {
        patterns.push(j % 2 === 0 ? 1 : 0);
      }
    }
    return patterns;
  };

  const pattern = generatePattern(value || 'NOSKU');
  const barWidth = width / pattern.length;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {pattern.map((bar, index) => (
          bar === 1 && (
            <Rect
              key={index}
              x={index * barWidth}
              y={0}
              width={barWidth}
              height={height}
              fill="black"
            />
          )
        ))}
      </Svg>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'monospace',
  },
});