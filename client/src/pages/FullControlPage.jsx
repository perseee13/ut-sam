import SquidTopicPage from "./SquidTopicPage.jsx";
import TopicSiblings from "../components/TopicSiblings.jsx";
import { FULL_CONTROL } from "../data/full-control.js";

export default function FullControlPage() {
  return (
    <SquidTopicPage
      topic={FULL_CONTROL}
      backTo="/"
      backLabel="Back to home"
      siblings={<TopicSiblings current={FULL_CONTROL.slug} sub="More Linux server topics." />}
    />
  );
}