import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { OPEN_SOURCE } from "../data/open-source.js";

export default function OpenSourcePage() {
  return (
    <SquidTopicPage
      topic={OPEN_SOURCE}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={OPEN_SOURCE.slug} sub="More Linux server topics." />}
    />
  );
}