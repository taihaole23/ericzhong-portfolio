import {
  Heading,
  Flex,
  Button,
} from "@once-ui-system/core";
import { person } from "@/resources";

export default function Home() {
  return (
    <Flex fillWidth fillHeight direction="column" gap="32" horizontal="center" vertical="center">
      <Heading
        variant="display-strong-xl"
        style={{
          fontSize: 'clamp(3rem, 10vw, 8rem)', // Responsive and 20% bigger (rough estimate)
          lineHeight: '1',
          textAlign: 'center'
        }}
      >
        {person.name.toUpperCase()}
      </Heading>
      <Flex gap="16" horizontal="center" wrap>
        <Button
          href="/font-maker"
          variant="secondary"
          size="l"
          weight="strong"
        >
          Font Maker
        </Button>
        <Button
          href="#"
          variant="secondary"
          size="l"
          weight="strong"
        >
          Holder 1
        </Button>
        <Button
          href="#"
          variant="secondary"
          size="l"
          weight="strong"
        >
          Holder 2
        </Button>
        <Button
          href="#"
          variant="secondary"
          size="l"
          weight="strong"
        >
          Holder 3
        </Button>
      </Flex>
    </Flex>
  );
}
