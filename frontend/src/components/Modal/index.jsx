import { useEffect } from "react";
import styles from "./Modal.module.scss";
import PropTypes from "prop-types";
function Modal({
  isOpen = false,
  children,
  closeTimeoutMS = 0,
  bodyOpenClassName,
  onRequestClose,
}) {
  const handleRequestClose = () => {
    setTimeout(onRequestClose, closeTimeoutMS);
  };
  useEffect(() => {
    const handle = (e) => {
      console.log(e.code);

      if (e.code === "Escape") {
        handleRequestClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keyup", handle);
    }
    // cleanup funtion
    return () => {
      document.removeEventListener("keyup", handle);
    };
  }, [isOpen, onRequestClose, handleRequestClose]);
  useEffect(() => {
    document.body.classList.add(bodyOpenClassName);
    return () => {
      document.body.classList.remove(bodyOpenClassName);
    };
  }, [bodyOpenClassName]);
  if (!isOpen) return null;
  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <div className={styles.body}>{children}</div>
      </div>
      <div className={styles.overlay} onClick={handleRequestClose} />
    </div>
  );
}
Modal.protoTypes = {
  isOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onRequestClose: PropTypes.func,
  closeTimeoutMS: PropTypes.number,
  bodyOpenClassName: PropTypes.string,
};
export default Modal;
