import { ScreenHead } from '../components/bits.jsx';
import TranslateBox from '../components/TranslateBox.jsx';

// The same translator as Home, opened on its own at #translate.
export default function Translate({ go, ...box }) {
  return (
    <>
      <ScreenHead title="Translate" onBack={() => go('new')} />
      <TranslateBox {...box} />
    </>
  );
}
