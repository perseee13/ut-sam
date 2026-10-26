import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { HIGH_PERFORMANCE } from "../data/high-performance.js";

export default function HighPerformancePage() {
  return (
    <SquidTopicPage
      topic={HIGH_PERFORMANCE}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={HIGH_PERFORMANCE.slug} sub="More Linux server topics." />}
    />
  );
}