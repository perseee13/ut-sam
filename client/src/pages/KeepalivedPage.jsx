import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { KEEPALIVED } from "../data/keepalived.js";

export default function KeepalivedPage() {
  return (
    <SquidTopicPage
      topic={KEEPALIVED}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={KEEPALIVED.slug} sub="More Linux server topics." />}
    />
  );
}