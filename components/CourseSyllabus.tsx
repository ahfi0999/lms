import {
  Accordion,
  List,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  createStyles,
  useMantineTheme,
} from '@mantine/core';
import { useRef } from 'react';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { Course, Topic } from '../types/courses';
import { idSchema } from '../lib/schemas/zod-schemas';

type CourseSyllabusProps = {
  course: Course;
  toggleTopic: (topic: Topic) => void;
  toggleChapter: (chapterId: number[]) => void;
  openChapters: number[];
  selectedTopic: Topic | null;
  closeSyllabusDrawer?: () => void;
};

const useStyles = createStyles((theme) => ({
  listItem: {
    padding: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.gray[4]}`,
    paddingLeft: '3em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  listItemInner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
}));

function CourseSyllabus(props: CourseSyllabusProps) {
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <>
      <Stack spacing={0}>
        <Accordion
          multiple
          styles={{
            content: {
              padding: 0,
            },
            control: {
              '&:hover': {
                backgroundColor: theme.colors.blue[6],
                color: theme.colors.blue[0],
              },
            },
          }}
          sx={{
            boxShadow: theme.shadows.sm,
          }}
          chevronPosition="right"
          value={props.openChapters.map((id) => String(id))}
          defaultValue={[String(idSchema.parse(props.course.modules.at(-1)!.id))]}
          variant="contained"
          onChange={(values) => props.toggleChapter(values.map((value) => idSchema.parse(value)))}
        >
          {props.course.modules.map((module, moduleIndex) => {
            const isActive = props.openChapters.includes(module.id);
            return (
              <Accordion.Item key={module.id} value={String(module.id)}>
                <Accordion.Control bg={isActive ? 'blue.6' : undefined}>
                  <Text component="span" fw="bold" pr="sm" color={isActive ? 'white' : undefined}>
                    {moduleIndex + 1}.
                  </Text>
                  <Text component="span" color={isActive ? 'white' : undefined}>
                    {module.title}
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <List listStyleType="none">
                    {module.topics.map((topic) => {
                      const isActive = props.selectedTopic?.id === topic.id;
                      return (
                        <List.Item key={topic.id} className={classes.listItem}>
                          <Tooltip label="Play" openDelay={1000}>
                            <UnstyledButton
                              onClick={() => {
                                if (props.closeSyllabusDrawer) {
                                  props.closeSyllabusDrawer();
                                }
                                props.toggleTopic(topic);
                              }}
                              className={classes.listItemInner}
                            >
                              <Text
                                color={isActive ? 'blue' : 'gray.7'}
                                fw={isActive ? 'bold' : undefined}
                              >
                                {topic.title}
                              </Text>
                              {isActive ? (
                                <ThemeIcon variant="light" size="sm">
                                  <Loader size="sm" variant="bars" />
                                </ThemeIcon>
                              ) : null}
                            </UnstyledButton>
                          </Tooltip>
                        </List.Item>
                      );
                    })}
                  </List>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Stack>
    </>
  );
}

export default CourseSyllabus;
