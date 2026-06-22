import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Text, Button } from '@/core/ui';
import { useTheme } from '@/core/theme';

export interface SnapCameraProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the captured photo's raw base64 (no data-URI prefix). */
  onCapture: (base64: string) => void;
}

/**
 * In-app camera for snaps. Capturing here (vs. launching the system camera)
 * keeps everything inside the app's own activity, so Android never destroys and
 * reloads the app the way it does when an external camera activity takes over.
 */
export function SnapCamera({ visible, onClose, onCapture }: SnapCameraProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);
  const camRef = useRef<CameraView>(null);

  const capture = async () => {
    if (!camRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await camRef.current.takePictureAsync({ base64: true, quality: 0.4 });
      if (photo?.base64) onCapture(photo.base64);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.flex}>
        {!permission?.granted ? (
          <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
            <Text variant="heading" center style={{ marginBottom: theme.spacing.md }}>
              Camera access needed
            </Text>
            <View style={{ width: '70%' }}>
              <Button title="Allow camera" onPress={requestPermission} variant="gradient" />
            </View>
            <Pressable onPress={onClose} style={{ marginTop: theme.spacing.lg }}>
              <Text color="textMuted">Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.flex}>
            <CameraView ref={camRef} style={styles.flex} facing={facing} />

            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
              <Text style={{ color: '#fff', fontSize: 26 }}>✕</Text>
            </Pressable>

            <View style={styles.controls}>
              <View style={styles.side} />
              <Pressable onPress={capture} disabled={busy} style={styles.shutterOuter}>
                {busy ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </Pressable>
              <Pressable
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                style={styles.side}
              >
                <Text style={{ fontSize: 30 }}>🔄</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  close: { position: 'absolute', top: 48, left: 20 },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  side: { width: 56, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
});
