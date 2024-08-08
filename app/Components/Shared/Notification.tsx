import { notification } from "antd";
import { BsExclamationDiamond } from "react-icons/bs";

const openNotification = (title:string, message:string, color:string) => {
  notification.open({
    message: title,
    description: message,
    icon: <BsExclamationDiamond style={{ color: color }} />,
    onClick: () => {
      console.log('Notification Clicked!');
    },
    duration:2
  });
};

export default openNotification