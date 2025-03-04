import { motion } from 'framer-motion';

export const CyberButton = ({ children, onClick }) => (
  <motion.button
    className="cyber-button"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    {children}
  </motion.button>
);