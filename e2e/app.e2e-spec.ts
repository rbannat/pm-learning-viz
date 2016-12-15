import { PmLearningVizPage } from './app.po';

describe('pm-learning-viz App', function() {
  let page: PmLearningVizPage;

  beforeEach(() => {
    page = new PmLearningVizPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
