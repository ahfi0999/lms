import { useEffect, useMemo, useState } from 'react';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  FileInput,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
  Title,
  createStyles,
  keyframes,
} from '@mantine/core';
import {
  IconCertificate,
  IconCheck,
  IconClipboardCheck,
  IconDiscountCheck,
  IconExternalLink,
  IconInfoCircle,
  IconMail,
  IconPhotoUp,
  IconSparkles,
  IconStar,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { GetServerSidePropsContext } from 'next';
import RootLayout from '../layouts/root';
import { getSessionOrThrow } from '../lib/auth-utils';
import db from '../lib/db';
import logger from '../lib/logger';
import account from '../lib/data/account';

type CertificateRequestPageProps = {
  courses: { id: number; title: string }[];
  userName: string;
  reviewUrl: string;
};

const float = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-6px)' },
});

const useStyles = createStyles((theme) => ({
  page: {
    paddingBlock: theme.spacing.xl,
    background:
      theme.colorScheme === 'dark'
        ? 'transparent'
        : 'linear-gradient(180deg, #faf5ff 0%, #ffffff 60%)',
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    padding: `${theme.spacing.xl} ${theme.spacing.xl}`,
    background:
      theme.colorScheme === 'dark'
        ? 'linear-gradient(120deg, #1e3a8a 0%, #6b21a8 55%, #be185d 100%)'
        : 'linear-gradient(120deg, #1e40af 0%, #7c3aed 55%, #db2777 100%)',
    color: theme.white,
    boxShadow:
      theme.colorScheme === 'dark'
        ? '0 24px 50px -20px rgba(190, 24, 93, 0.45)'
        : '0 24px 50px -20px rgba(124, 58, 237, 0.45)',
  },
  heroBlob: {
    position: 'absolute',
    inset: '-80px -80px auto auto',
    width: 360,
    height: 360,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.45), rgba(124, 58, 237, 0.18) 60%, transparent 75%)',
    filter: 'blur(8px)',
    pointerEvents: 'none',
  },
  heroBlob2: {
    position: 'absolute',
    inset: 'auto auto -120px -80px',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(59, 130, 246, 0.35), rgba(124, 58, 237, 0.10) 60%, transparent 75%)',
    filter: 'blur(8px)',
    pointerEvents: 'none',
  },
  heroIcon: {
    animation: `${float} 4s ease-in-out infinite`,
  },
  goldChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.18)',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    fontSize: theme.fontSizes.xs,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    height: '100%',
    border:
      theme.colorScheme === 'dark'
        ? `1px solid ${theme.colors.dark[5]}`
        : `1px solid ${theme.colors.gray[2]}`,
  },
  reviewCard: {
    borderRadius: 16,
    background:
      theme.colorScheme === 'dark'
        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(219, 39, 119, 0.10) 100%)'
        : 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)',
    border:
      theme.colorScheme === 'dark' ? `1px solid rgba(168, 85, 247, 0.35)` : `1px solid #ddd6fe`,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: theme.fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  formField: {
    transition: 'transform 150ms ease',
    '&:focus-within': { transform: 'translateY(-1px)' },
  },
  successCircle: {
    background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(20,184,166,0.15) 100%)',
    width: 96,
    height: 96,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: theme.fontSizes.sm,
    color: theme.white,
    background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #db2777 100%)',
    boxShadow: '0 4px 12px -4px rgba(124, 58, 237, 0.55)',
  },
  preview: {
    width: '100%',
    maxHeight: 220,
    objectFit: 'contain',
    borderRadius: theme.radius.md,
    border: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #db2777 100%)',
    border: 'none',
    boxShadow: '0 6px 18px -6px rgba(124, 58, 237, 0.6)',
    transition: 'transform 150ms ease, box-shadow 150ms ease, filter 150ms ease',
    '&:hover:not(:disabled)': {
      transform: 'translateY(-1px)',
      boxShadow: '0 10px 26px -8px rgba(219, 39, 119, 0.6)',
      filter: 'brightness(1.05)',
    },
  },
  reviewBtn: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    border: 'none',
    color: theme.white,
    boxShadow: '0 6px 18px -6px rgba(219, 39, 119, 0.55)',
    transition: 'transform 150ms ease, filter 150ms ease',
    '&:hover': { transform: 'translateY(-1px)', filter: 'brightness(1.05)' },
  },
}));

function CertificateRequestPage(props: CertificateRequestPageProps) {
  const { classes } = useStyles();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [reviewScreenshot, setReviewScreenshot] = useState<File | null>(null);
  const [reviewedClicked, setReviewedClicked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const courseOptions = props.courses.map((c) => ({ value: String(c.id), label: c.title }));
  const selectedCourse = props.courses.find((c) => String(c.id) === courseId);

  const previewUrl = useMemo(() => {
    if (reviewScreenshot instanceof File) return URL.createObjectURL(reviewScreenshot);
    return null;
  }, [reviewScreenshot]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canSubmit = Boolean(courseId && reviewScreenshot);

  const handleSubmit = () => {
    if (!courseId) {
      notifications.show({
        title: 'Pick a course',
        message: 'Please select the course you want a certificate for.',
        color: 'red',
      });
      return;
    }
    if (!reviewScreenshot) {
      notifications.show({
        title: 'Review screenshot required',
        message: 'Please upload a screenshot of the review you posted.',
        color: 'red',
      });
      return;
    }
    notifications.show({
      title: 'Request submitted',
      message: 'Your certificate request has been received. You will be notified by email.',
      color: 'teal',
      icon: <IconCheck />,
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setCourseId(null);
    setNotes('');
    setReviewScreenshot(null);
    setReviewedClicked(false);
    setSubmitted(false);
  };

  return (
    <RootLayout>
      <Box className={classes.page}>
        <Container size="lg">
          <Paper className={classes.hero} mb="xl">
            <Box className={classes.heroBlob} />
            <Box className={classes.heroBlob2} />
            <Group spacing="xl" noWrap align="center" sx={{ position: 'relative', zIndex: 1 }}>
              <Box className={classes.heroIcon}>
                <ThemeIcon
                  size={96}
                  radius="xl"
                  sx={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
                    boxShadow: '0 12px 30px -10px rgba(255, 255, 255, 0.5)',
                    color: '#7c3aed',
                  }}
                >
                  <IconCertificate size={52} stroke={1.5} />
                </ThemeIcon>
              </Box>
              <Stack spacing={10} sx={{ flex: 1, minWidth: 0 }}>
                <Group spacing="xs">
                  <Box className={classes.goldChip}>
                    <IconStar size={12} />
                    Achievement
                  </Box>
                  <Text
                    size="xs"
                    tt="uppercase"
                    weight={700}
                    sx={{ letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)' }}
                  >
                    Course completion
                  </Text>
                </Group>
                <Title
                  order={1}
                  sx={{ lineHeight: 1.05, fontSize: '2.5rem', color: '#fff', fontWeight: 800 }}
                >
                  Request your certificate
                </Title>
                <Text size="md" maw={620} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Leave a review of the institute, upload the screenshot, and we'll prepare a
                  personalized certificate. Reviews typically take{' '}
                  <Text component="span" weight={700} sx={{ color: '#fbcfe8' }}>
                    3–5 business days
                  </Text>
                  .
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Grid gutter="xl">
            <Grid.Col span={12} md={7}>
              {submitted ? (
                <Paper className={classes.card} shadow="xs" p="xl" withBorder>
                  <Stack spacing="lg" align="center" py="xl">
                    <Box className={classes.successCircle}>
                      <ThemeIcon size={64} radius="xl" color="teal" variant="filled">
                        <IconDiscountCheck size={36} />
                      </ThemeIcon>
                    </Box>
                    <Stack spacing={4} align="center">
                      <Title order={3}>Request received</Title>
                      <Text color="dimmed" ta="center" maw={460}>
                        Thanks{props.userName ? `, ${props.userName.split(' ')[0]}` : ''}! Your
                        certificate request for{' '}
                        <Text component="span" weight={600}>
                          {selectedCourse?.title}
                        </Text>{' '}
                        has been logged along with your review screenshot. We'll email you once it's
                        verified.
                      </Text>
                    </Stack>
                    <Group>
                      <Button variant="light" onClick={handleReset}>
                        Submit another
                      </Button>
                      <Button component="a" href="/dashboard">
                        Back to dashboard
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              ) : (
                <Stack spacing="lg">
                  <Paper className={classes.reviewCard} shadow="xs" p="lg" withBorder={false}>
                    <Group spacing="md" noWrap align="flex-start">
                      <Box className={classes.stepBadge}>1</Box>
                      <Stack spacing={6} sx={{ flex: 1 }}>
                        <Group spacing="xs">
                          <IconStar size={16} color="#f59e0b" />
                          <Text weight={700}>Leave a review on our institute page</Text>
                          {reviewedClicked ? (
                            <Badge color="teal" variant="light" size="sm">
                              Opened
                            </Badge>
                          ) : null}
                        </Group>
                        <Text size="sm" color="dimmed">
                          Open the review page in a new tab, share a few honest words, then take a
                          screenshot and come back here.
                        </Text>
                        <Group mt={4}>
                          <Button
                            component="a"
                            href={props.reviewUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            leftIcon={<IconStar size={16} />}
                            rightIcon={<IconExternalLink size={14} />}
                            className={classes.reviewBtn}
                            onClick={() => setReviewedClicked(true)}
                          >
                            Open review page
                          </Button>
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>

                  <Paper className={classes.card} shadow="xs" p="xl" withBorder>
                    <Group spacing="md" mb="lg" align="center">
                      <Box className={classes.stepBadge}>2</Box>
                      <Text className={classes.sectionTitle}>Upload review screenshot</Text>
                    </Group>

                    <Stack spacing="md">
                      <Box className={classes.formField}>
                        <FileInput
                          label="Review screenshot"
                          description="PNG or JPG of the review you just posted"
                          placeholder="Click to upload screenshot"
                          accept="image/png, image/jpeg"
                          value={reviewScreenshot}
                          onChange={(file) => setReviewScreenshot(file)}
                          icon={<IconPhotoUp size={16} />}
                          size="md"
                        />
                      </Box>

                      {previewUrl ? (
                        <Box>
                          <Text size="xs" color="dimmed" mb={6}>
                            Preview
                          </Text>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="Review screenshot preview"
                            className={classes.preview}
                          />
                        </Box>
                      ) : null}
                    </Stack>
                  </Paper>

                  <Paper className={classes.card} shadow="xs" p="xl" withBorder>
                    <Group spacing="md" mb="lg" align="center">
                      <Box className={classes.stepBadge}>3</Box>
                      <Text className={classes.sectionTitle}>Request details</Text>
                    </Group>

                    {props.courses.length === 0 ? (
                      <Stack spacing="md" align="center" py="xl">
                        <ThemeIcon size={56} radius="xl" color="gray" variant="light">
                          <IconInfoCircle size={28} />
                        </ThemeIcon>
                        <Title order={4} ta="center">
                          No eligible courses yet
                        </Title>
                        <Text color="dimmed" ta="center" maw={360}>
                          Enroll in a course before requesting a certificate.
                        </Text>
                        <Button component="a" href="/dashboard" variant="light">
                          Back to dashboard
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing="md">
                        <Box className={classes.formField}>
                          <Select
                            label="Course"
                            description="The course you'd like a certificate for"
                            placeholder="Select a course"
                            data={courseOptions}
                            value={courseId}
                            onChange={setCourseId}
                            size="md"
                            searchable
                            nothingFound="No matching courses"
                            icon={<IconCertificate size={16} />}
                          />
                        </Box>

                        <Box className={classes.formField}>
                          <Textarea
                            label="Notes"
                            description="Optional — preferred name on the certificate, or anything else"
                            placeholder="e.g. Please use the name 'Jane A. Doe' on the certificate"
                            minRows={3}
                            autosize
                            value={notes}
                            onChange={(e) => setNotes(e.currentTarget.value)}
                            size="md"
                          />
                        </Box>

                        <Divider my="xs" />

                        <Group position="apart" align="center">
                          <Group spacing="xs">
                            {courseId ? (
                              <Badge variant="light" color="teal" size="lg" radius="sm">
                                Course selected
                              </Badge>
                            ) : null}
                            {reviewScreenshot ? (
                              <Badge variant="light" color="teal" size="lg" radius="sm">
                                Screenshot attached
                              </Badge>
                            ) : null}
                          </Group>
                          <Button
                            onClick={handleSubmit}
                            leftIcon={<IconCertificate size={16} />}
                            disabled={!canSubmit}
                            size="md"
                            className={classes.primaryBtn}
                          >
                            Submit request
                          </Button>
                        </Group>
                      </Stack>
                    )}
                  </Paper>
                </Stack>
              )}
            </Grid.Col>

            <Grid.Col span={12} md={5}>
              <Paper className={classes.card} shadow="xs" p="xl" withBorder>
                <Group spacing="xs" mb="lg">
                  <IconSparkles size={18} />
                  <Text className={classes.sectionTitle}>How it works</Text>
                </Group>
                <Timeline active={-1} bulletSize={28} lineWidth={2}>
                  <Timeline.Item bullet={<IconStar size={14} />} title="Leave a review">
                    <Text color="dimmed" size="sm">
                      Open our review page and share your experience.
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item bullet={<IconPhotoUp size={14} />} title="Upload the screenshot">
                    <Text color="dimmed" size="sm">
                      Attach a screenshot of the review for verification.
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item
                    bullet={<IconClipboardCheck size={14} />}
                    title="Request submitted"
                  >
                    <Text color="dimmed" size="sm">
                      Pick the course and submit. Our team verifies your review.
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item bullet={<IconMail size={14} />} title="Certificate emailed">
                    <Text color="dimmed" size="sm">
                      The personalized PDF certificate is sent to your registered email within 3–5
                      business days.
                    </Text>
                  </Timeline.Item>
                </Timeline>

                <Divider my="lg" />

                <Stack spacing={4}>
                  <Text size="sm" weight={600}>
                    Need help?
                  </Text>
                  <Text size="sm" color="dimmed">
                    Email{' '}
                    <Anchor href={`mailto:${account.supportEmail}`}>{account.supportEmail}</Anchor>{' '}
                    if you don't hear back in a week.
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </RootLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    let user;
    try {
      const session = await getSessionOrThrow(context.req, context.res);
      user = session.user;
    } catch (error) {
      logger.error(error);
      return {
        redirect: {
          destination: `/api/auth/login?returnTo=/certificate-request`,
          permanent: false,
        },
      };
    }

    const courses = await db.course.findMany({
      where: { users: { has: user.sub }, archived: false },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });

    const reviewUrl =
      process.env.NEXT_PUBLIC_INSTITUTE_REVIEW_URL ||
      'https://www.google.com/search?q=Digital+Lync+reviews';

    return {
      props: {
        courses,
        userName: user?.name || user?.nickname || '',
        reviewUrl,
      },
    };
  },
});

export default CertificateRequestPage;
