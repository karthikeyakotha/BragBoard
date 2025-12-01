
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  const icons = {
    light: <FaSun />,
    dark: <FaMoon />,
    system: <FaDesktop />,
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    >
      {icons[theme]}
    </button>
  );
}

export default ThemeToggleButton;
