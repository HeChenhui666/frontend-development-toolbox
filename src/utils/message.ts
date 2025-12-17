import { message } from 'antd';

export const showMessage = {
  success: (content: string) => {
    message.success(content, 2);
  },
  info: (content: string) => {
    message.info(content, 2);
  },
  warning: (content: string) => {
    message.warning(content, 2);
  },
  error: (content: string) => {
    message.error(content, 2);
  },
};

