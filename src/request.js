import ScreenRecord from "./utils/screen-record";

export default function requestHandler(request, res) {
  const screenRecord = ScreenRecord.get_default();
  switch (request) {
    case "screen-record":
      res("ok");
      screenRecord.start();
      break;
    case "screenshot":
      res("ok");
      screenRecord.screenshot(true);
      break;
    case "screenshot-select":
      res("ok");
      screenRecord.screenshot();
      break;
    default:
      res("not ok");
      break;
  }
}
