import EVMThrow from './helpers/EVMThrow';
const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const Token = artifacts.require('VerifiedTokenMock');
const Controller = artifacts.require('VerifiedTokenController');
const Registry = artifacts.require('VerifiedTokenRegistry');


contract('VerifiedTokenController.sol', function ([deployer, registered, stranger]) {

    before(async function () {
        this.registry = await Registry.new();
        this.cntlr = await Controller.new([this.registry.address], 1);
        this.token = await Token.new(this.cntlr.address);
    });

    describe('updateRequiredConfirmations()', function () {
        it('should update confirmations number and fire an event', async function () {
            const {logs} = await this.cntlr.updateRequiredConfirmations(5).should.be.fulfilled;
            const event = logs.find(e => e.event === 'RequiredConfirmationsUpdated');
            should.exist(event);
            event.args.confirmations.toNumber().should.equal(5);
        });
    });

    describe('updateRequiredData()', function () {
        it('should fail if number of keys not the same as the number of values', async function () {
            await this.cntlr.updateRequiredData(["token address","allowed age group"],["18+"]).should.be.rejectedWith(EVMThrow);
        });

        it('should update key => value pairs and fire an event for each pair', async function () {
            const {logs} = await this.cntlr.updateRequiredData(["id type","allowed age group"],["passport","18+"]).should.be.fulfilled;
            const event = logs.filter(e => e.event === 'RequiredDataUpdated');

            should.exist(event);
            event.length.should.equal(2);

            toUtf8(event[0].args.key).should.equal("id type");
            toUtf8(event[0].args.value).should.equal("passport");

            toUtf8(event[1].args.key).should.equal("allowed age group");
            toUtf8(event[1].args.value).should.equal("18+");
        });
    });

    describe('isVerified()', function () {
        it('should return TRUE if required number of confirmations = 0', async function () {
            await this.cntlr.updateRequiredConfirmations(0);
            (await this.cntlr.isVerified(stranger)).should.be.true;
        });

        it('should return FALSE if required number of confirmations > 0', async function () {
            await this.cntlr.updateRequiredConfirmations(2);
            (await this.cntlr.isVerified(stranger)).should.be.false;
        });
    });

    describe('isContract()', function () {

        it('should return FALSE if address is not a contract', async function () {
            (await this.cntlr.isContract(stranger)).should.be.false;
        });

        it('should return TRUE if address is a contract', async function () {
            (await this.cntlr.isContract(this.registry.address)).should.be.true;
        });

    });

    describe('updateRegistries()', function () {

        it('should fail if registry address is not a contract', async function () {
            await this.cntlr.updateRegistries([0x1]).should.be.rejectedWith(EVMThrow);
        });

        it('should fail if zero address', async function () {
            await this.cntlr.updateRegistries([0x0]).should.be.rejectedWith(EVMThrow);
        });

        it('otherwise, should update list of registries and fire an event', async function () {
            const {logs} = await this.cntlr.updateRegistries([this.registry.address, this.token.address]).should.be.fulfilled;
            const event = logs.find(e => e.event === 'AcceptedRegistriesUpdated');
            should.exist(event);
            event.args.registries.length.should.equal(2);
            event.args.registries[0].should.equal(this.registry.address);
            event.args.registries[1].should.equal(this.token.address);
        });

    });

});


// https://github.com/ethereum/web3.js/issues/337#issuecomment-197750774
var toUtf8 = function(hex) {
    return web3.toAscii(hex).replace(/\u0000/g, '');
};