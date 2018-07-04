import { configure, mount } from 'enzyme'
import { PNG } from 'pngjs'
import Adapter from 'enzyme-adapter-react-16'
import fs from 'fs'
import puppeteer from 'puppeteer'
import React from 'react'
import { compare } from 'resemblejs'

import Routes from '../routes'

const testDir = './src/__tests__/__screenshots__'
const goldenDir = './src/__tests__/__golden__'
const diffDir = './src/__tests__/__diffs__'

configure({ adapter: new Adapter() })

function compareImages(image1, image2) {
  console.log('compareImages', image1, image2)
  return new Promise((resolve, reject) => {
    console.log('compareImages - 1')
    compare(
      image1,
      image2,
      {},
      (data, error) => {
        console.log('compareImages - 2')
        console.log({ data })
        console.log({ error })
        resolve(data)
        // expect(10).toBe(100)

        // expect(data.misMatchPercentage).toBe(100)
        // await fs.writeFile(`${diffDir}/${fileName}.png`, data.getBuffer())
        /*
        {
          misMatchPercentage : 100, // %
          isSameDimensions: true, // or false
          dimensionDifference: { width: 0, height: -1 }, // defined if dimensions are not the same
          getImageDataUrl: function(){}
        }
      */
      },
      err => {
        console.log('compareImages - 3')
        console.log({ err })
        reject(err)
        // expect(10).toBe(100)
      },
    )
  })
}

async function readImage(path) {
  return new Promise(resolve =>
    fs
      .createReadStream(path)
      .pipe(new PNG())
      .on('parsed', res => {
        resolve(res)
      })
      .on('error', err => {
        console.log(`An error occurred: ${err}`)
      }),
  )
}

async function processScreenshot(fileName) {
  const [image1, image2] = await Promise.all([
    readImage(`${testDir}/${fileName}.png`),
    readImage(`${goldenDir}/${fileName}.png`),
  ])

  await compareImages(image1, image2)
}

async function takeAndCompareScreenshot(page, route, screenSize) {
  const fileName = `${screenSize}/${route || 'index'}`

  await page.goto(`http://localhost:8888/${route}`)
  await page.screenshot({ path: `${testDir}/${fileName}.png`, fullPage: true })
  return processScreenshot(fileName)
}

describe('app', () => {
  it('renders without crashing', () => {
    mount(<Routes />)
  })
})

describe('dinosaurs are partying', () => {
  let browser = null
  let page = null

  beforeAll(async () => {
    if (!fs.existsSync(goldenDir)) fs.mkdirSync(goldenDir)
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir)
    if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir)
    if (!fs.existsSync(`${diffDir}/desktop`)) fs.mkdirSync(`${diffDir}/desktop`)
    if (!fs.existsSync(`${diffDir}/mobile`)) fs.mkdirSync(`${diffDir}/mobile`)
    if (!fs.existsSync(`${testDir}/desktop`)) fs.mkdirSync(`${testDir}/desktop`)
    if (!fs.existsSync(`${testDir}/mobile`)) fs.mkdirSync(`${testDir}/mobile`)
  })

  beforeEach(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  })

  afterEach(() => browser.close())

  describe('desktop screen', async () => {
    beforeEach(async () => page.setViewport({ width: 800, height: 600 }))
    it('/', async () => takeAndCompareScreenshot(page, '', 'desktop'))
  })

  // describe('mobile screen', () => {
  //   beforeEach(async () => page.setViewport({ width: 375, height: 667 }))
  //   it('/', async () => takeAndCompareScreenshot(page, '', 'mobile'))
  // })
})
