/**
 * Component map passed to `<Content components={components} />` so MDX bodies
 * can use bare tags (`<Promo …/>`, `<Callout …/>`) with no per-file imports.
 * Studio editors therefore never write an import line in content.
 */
import Promo from '@civictheme/organisms/Promo.astro';
import Campaign from '@civictheme/organisms/Campaign.astro';
import Slider from '@civictheme/organisms/Slider.astro';
import Slide from '@civictheme/organisms/Slide.astro';
import Webform from '@civictheme/organisms/Webform.astro';
import Callout from '@civictheme/molecules/Callout.astro';
import NextStep from '@civictheme/molecules/NextStep.astro';
import Accordion from '@civictheme/molecules/Accordion.astro';
import Tabs from '@civictheme/molecules/Tabs.astro';
import BasicContent from '@civictheme/molecules/BasicContent.astro';
import Attachment from '@civictheme/molecules/Attachment.astro';
import Figure from '@civictheme/molecules/Figure.astro';
import Map from '@civictheme/molecules/Map.astro';
import VideoPlayer from '@civictheme/molecules/VideoPlayer.astro';
import Table from '@civictheme/atoms/Table.astro';
import Iframe from '@civictheme/atoms/Iframe.astro';
import Heading from '@civictheme/atoms/Heading.astro';
import Paragraph from '@civictheme/atoms/Paragraph.astro';
import Button from '@civictheme/atoms/Button.astro';
import Link from '@civictheme/atoms/Link.astro';
import Grid from '@civictheme/base/Grid.astro';
import PromoCard from '@civictheme/molecules/PromoCard.astro';
import NavigationCard from '@civictheme/molecules/NavigationCard.astro';
import SubjectCard from '@civictheme/molecules/SubjectCard.astro';
import ManualList from '@/components/ManualList.astro';
import ListingAuto from '@/components/ListingAuto.astro';

export const components = {
  Promo,
  Callout,
  NextStep,
  Accordion,
  Tabs,
  Campaign,
  Slider,
  Slide,
  ManualList,
  ListingAuto,
  BasicContent,
  Attachment,
  Figure,
  Table,
  Iframe,
  Map,
  VideoPlayer,
  Webform,
  Grid,
  PromoCard,
  NavigationCard,
  SubjectCard,
  Heading,
  Paragraph,
  Button,
  Link,
};

export default components;
