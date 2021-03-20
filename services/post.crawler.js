const Crawler = require('crawler');
const PostModel = require('../model/post.model');
const slug = require('slug');
const helper = require('./helper');
const VIP_TYPES = require('../constant/vip-types');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const address = require('../constant/address');
require('dotenv').config();

const decodeStringToEmail = (encodeStr) => {
    const regex = /\'\>.*\<\/a\>/;
    return entities.decode(encodeStr.match(regex)[0].slice(2, -4));
};
const convertStringToDate = (str) => {
    const arrString = str.split('\r\n');
    const newDate = arrString[1].split('-');
    return new Date(newDate[2], newDate[1] - 1, newDate[0]);
};
const findVipType = (vipType) => {
    return VIP_TYPES[vipType];
};

const crawlPrice = (str) => {
    return str.split(" ");
};
const numberOfRooms = (numb) => {
    let newNumb = '';
    if(numb === ""){
        newNumb = -1
    }else {
        newNumb = parseInt(numb);
    }
    return newNumb;
};
const detailCrawler = new Crawler({
    rateLimit: 2000,
    maxConnections : 1,
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
    // This will be called for each crawled page
    callback : async function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            const $ = res.$;
            const title = helper.removeBreakLineCharacter($('#product-detail-web > h1').text());
            const titleSlug = slug(title).toLowerCase();
            const price = helper.removeBreakLineCharacter($('#product-detail-web > div.short-detail-wrap > ul > li > span.sp2').text());
            const url = res.options.uri;
            let newPrice = [];
            if(price == null || price === 'Thỏa thuận'){
                newPrice.push(-1);
                newPrice.push('');
            }else {
                newPrice = crawlPrice(price);
            }

            const area = helper.removeBreakLineCharacter($('#product-detail-web > div.short-detail-wrap > ul > li:nth-child(2) > span.sp2').text());
            const newArea = [];
            if(area === null || area ==='Không xác định'){
                newArea.push(-1);
                newArea.push('Không xác định');
            }else {
                newArea.push(area.slice(0, -2));
                newArea.push(area.slice(-2));
            }
            const introduce = helper.removeBreakLineCharacter($('#product-detail-web > div.detail-product > div.detail-1.pad-bot-16 > div.des-product').text());
            const images = $('.slide-product > .swiper-container div > .swiper-slide.swiper-slide-visible > img').map((index, ele) => {
                return ele.attribs.src;
            }).get();
            const postType = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > div > div > div > span.r2').text());
            const newPostType = findPostTypeByTitle(postType);
            if(newPostType === undefined){
                done();
                return;
            }
            const address = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > div > div > div:nth-child(2) > span.r2').text());
            const bedrooms = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > div > div > div:nth-child(7) > span.r2').text());
            const newBedrooms = numberOfRooms(bedrooms);
            const toilets = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > div > div > div:nth-child(8) > span.r2').text());
            const newToilets = numberOfRooms(toilets);
            const code = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > .product-config.pad-16 > ul > li:nth-child(4) > span.sp3').text());
            const vipPostType = findVipType($('#product-detail-web > .detail-product > .product-config.pad-16 > ul > li:nth-child(3) > span.sp3').text());
            const postedAt = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > .product-config.pad-16 > ul > li > span.sp3').text());
            const newPostedAt = convertStringToDate(postedAt);
            const expiredAt = helper.removeBreakLineCharacter($('#product-detail-web > .detail-product > .product-config.pad-16 > ul > li:nth-child(2) > span.sp3').text());
            const newExpiredAt = convertStringToDate(expiredAt);

            const postData = {
                title: title,
                price: newPrice[0],
                priceUnit: newPrice[1],
                area: newArea[0],
                areaUnit: newArea[1],
                url: url,
                introduce: introduce,
                images: images,
                address: address,
                city: address.city,
                district: address.district,
                ward: address.ward,
                projectId: '',
                bedrooms: newBedrooms,
                toilets: newToilets,
                code: code,
                vipPostType: vipPostType,
                postedAt: newPostedAt,
                expiredAt: newExpiredAt,
                slug: titleSlug
            };
            console.log(title);
            try{
                const duplicatedTitle = await PostModel.findOne({slug: titleSlug}).exec();
                if(duplicatedTitle) {
                    throw new Error('Duplicated title for rent: ' + title);
                }
                const findProject = await ProjectModel.findOne({url: detailProject[0]}).exec();
                if(!findProject){
                    postData.projectId = null;
                }else {
                    postData.projectId = findProject._id;
                }
                const postModel = new PostModel(postData);
                await postModel.save();
            }catch (err){
                console.error(err);
            }finally {
                done();
            }
        }
    }
});

const listCrawler = new Crawler({
    rateLimit: 2000,
    maxConnections : 1,
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            const $ = res.$;
            const links = $('#product-lists-web > div.product-item.clearfix > a').map((index, ele) => {
                console.log(ele);
                return 'https://batdongsan.com.vn' + ele.attribs.href;
            }).get();

            console.log(links);
            links.forEach(url => detailCrawler.queue(url));
        }
        done();
    }
});

module.exports = () => {
    listCrawler.queue('https://batdongsan.com.vn/ban-nha-rieng-phuong-ben-nghe');
};