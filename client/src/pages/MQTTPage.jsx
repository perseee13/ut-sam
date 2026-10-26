import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { MQTT } from "../data/mqtt.js";

export default function MQTTPage() {
  return (
    <SquidTopicPage
      topic={MQTT}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={MQTT.slug} sub="More Linux server topics." />}
    />
  );
}